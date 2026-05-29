import multiparty from "multiparty";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { unlink } from "fs/promises";
import sharp from "sharp";
import { randomUUID } from "crypto";
import { requireAdminSession, withSessionRoute } from "@/lib/session";

const S3BucketName =
  process.env.S3_BUCKET_NAME || "mm-fashion-store-463183325467-eu-north-1-an";
const S3Region = process.env.S3_REGION || "eu-north-1";
const MAX_FILE_COUNT = 10;
const MAX_FILE_SIZE = 6 * 1024 * 1024;
const UPLOAD_CONCURRENCY = 3;
const FULL_IMAGE_WIDTH = 1400;
const THUMB_IMAGE_WIDTH = 360;
const FULL_IMAGE_QUALITY = 82;
const THUMB_IMAGE_QUALITY = 68;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getPublicUrl(key) {
  return `https://${S3BucketName}.s3.${S3Region}.amazonaws.com/${key}`;
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      if (currentIndex >= items.length) {
        return;
      }

      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );

  return results;
}

export default withSessionRoute(async function ImageHandler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    requireAdminSession(req);

    if (!process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_ACCESS_KEY) {
      throw createHttpError(500, "S3 credentials are not configured");
    }

    const form = new multiparty.Form({ maxFilesSize: MAX_FILE_SIZE * MAX_FILE_COUNT });
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (error, fields, files) => (error ? reject(error) : resolve({ fields, files })));
    });

    const incomingFiles = Array.isArray(files?.file) ? files.file : [];
    if (!incomingFiles.length) {
      return res.status(400).json({ error: "No files were uploaded" });
    }

    if (incomingFiles.length > MAX_FILE_COUNT) {
      return res.status(400).json({ error: `A maximum of ${MAX_FILE_COUNT} files can be uploaded at once` });
    }

    const client = new S3Client({
      region: S3Region,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });

    const links = [];
    const failedUploads = [];

    const uploadResults = await mapWithConcurrency(
      incomingFiles,
      UPLOAD_CONCURRENCY,
      async (file) => {
        const mimeType = String(file.headers?.["content-type"] || "").toLowerCase();

        try {
          if (!ALLOWED_TYPES.has(mimeType)) {
            throw createHttpError(415, `Unsupported file type: ${mimeType || "unknown"}`);
          }

          if (file.size > MAX_FILE_SIZE) {
            throw createHttpError(413, `${file.originalFilename || "File"} exceeds the maximum size limit`);
          }

          const image = sharp(file.path).rotate();
          const metadata = await image.metadata();

          if (!metadata.width || !metadata.height) {
            throw createHttpError(400, "Unable to read image dimensions");
          }

          const keyPrefix = `uploads/${new Date().toISOString().slice(0, 10)}/${randomUUID()}`;

          const [fullBuffer, thumbBuffer] = await Promise.all([
            image
              .clone()
              .resize({ width: FULL_IMAGE_WIDTH, withoutEnlargement: true })
              .webp({ quality: FULL_IMAGE_QUALITY, effort: 4 })
              .toBuffer(),
            image
              .clone()
              .resize({ width: THUMB_IMAGE_WIDTH, withoutEnlargement: true })
              .webp({ quality: THUMB_IMAGE_QUALITY, effort: 4 })
              .toBuffer(),
          ]);

          const fullKey = `${keyPrefix}.webp`;
          const thumbKey = `${keyPrefix}_thumb.webp`;

          await Promise.all([
            client.send(
              new PutObjectCommand({
                Bucket: S3BucketName,
                Key: fullKey,
                Body: fullBuffer,
                ACL: "public-read",
                ContentType: "image/webp",
              })
            ),
            client.send(
              new PutObjectCommand({
                Bucket: S3BucketName,
                Key: thumbKey,
                Body: thumbBuffer,
                ACL: "public-read",
                ContentType: "image/webp",
              })
            ),
          ]);

          return {
            full: getPublicUrl(fullKey),
            thumb: getPublicUrl(thumbKey),
          };
        } catch (err) {
          console.error("Upload failed for file:", file.originalFilename, err);
          failedUploads.push({
            file: file.originalFilename || "unknown",
            message: err.message || "Upload failed",
          });
          return null;
        } finally {
          await unlink(file.path).catch(() => undefined);
        }
      }
    );

    links.push(...uploadResults.filter(Boolean));

    if (!links.length) {
      return res.status(400).json({
        error: "File upload failed",
        failedUploads,
      });
    }

    res.status(200).json({
      message: "Upload finished",
      links,
      failedUploads: failedUploads.length ? failedUploads : null,
      fields,
    });
  } catch (err) {
    console.error("Error during file upload:", err);
    res.status(err.statusCode || 500).json({ error: err.message || "File upload failed" });
  }
});

export const config = {
  api: { bodyParser: false },
};
