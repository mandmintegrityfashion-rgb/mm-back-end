"use client";

import axios from "axios";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { useDrag } from "@use-gesture/react";
import PromotionManagement from "./PromotionManagement";

export default function HeroSetup() {
  const [heroPages, setHeroPages] = useState([]);
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroImage, setHeroImage] = useState([]);
  const [heroBgImage, setHeroBgImage] = useState([]);
  const [ctaText, setCtaText] = useState("Shop Now");
  const [ctaLink, setCtaLink] = useState("/shop/shop");
  const [order, setOrder] = useState(0);
  const [status, setStatus] = useState("active");
  const [heroProgress, setHeroProgress] = useState(0);
  const [heroBgProgress, setHeroBgProgress] = useState(0);
  const [editId, setEditId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

  const heroImageRef = useRef(null);
  const heroBgImageRef = useRef(null);

  useEffect(() => {
    async function fetchHeroes() {
      try {
        const res = await fetch("/api/heroes");
        if (!res.ok) throw new Error("Failed to load heroes");
        const data = await res.json();
        const normalized = (data || []).map((h) => ({
          ...h,
          image: Array.isArray(h.image) ? h.image : [],
          bgImage: Array.isArray(h.bgImage) ? h.bgImage : [],
        }));
        setHeroPages(normalized);
      } catch (err) {
        console.error("Fetch heroes error:", err);
      }
    }
    fetchHeroes();
  }, []);

  // Upload Helper
  const uploadFileToS3 = async (file, setState, setProgress) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (setProgress) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percent);
          }
        },
      });

      const links = res.data.links;
      if (!links || !links[0]?.full) throw new Error("Invalid upload response");

      const finalObj = {
        full: links[0].full,
        thumb: links[0].thumb || links[0].full,
      };

      setState((prev) => [...prev, finalObj]);
      if (setProgress) setProgress(100);
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const removeImage = (index, setImageFn) => {
    setImageFn((prev) => prev.filter((_, i) => i !== index));
  };

  const handleHeroImageChange = async (file) => {
    if (!file) return;
    try {
      await uploadFileToS3(file, setHeroImage, setHeroProgress);
    } catch {
      alert("Hero image upload failed.");
    }
  };

  const handleBgImageChange = async (file) => {
    if (!file) return;
    try {
      await uploadFileToS3(file, setHeroBgImage, setHeroBgProgress);
    } catch {
      alert("Background image upload failed.");
    }
  };

  const addOrUpdateHeroPage = async () => {
    if (!heroTitle.trim() || heroImage.length === 0)
      return alert("Title & Hero Image required");

    const payload = {
      title: heroTitle,
      subtitle: heroSubtitle,
      image: heroImage.map(({ full, thumb }) => ({ full, thumb })),
      bgImage: heroBgImage.map(({ full, thumb }) => ({ full, thumb })),
      ctaText,
      ctaLink,
      order,
      status,
    };

    setUploading(true);
    try {
      let res;
      if (editId) {
        res = await fetch(`/api/heroes/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/heroes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) throw new Error("Save error");
      const result = await res.json();
      const normalized = {
        ...result,
        image: Array.isArray(result.image) ? result.image : [],
        bgImage: Array.isArray(result.bgImage) ? result.bgImage : [],
      };
      if (editId)
        setHeroPages((prev) =>
          prev.map((h) => (h._id === editId ? normalized : h))
        );
      else setHeroPages((prev) => [normalized, ...prev]);
      resetForm();
    } catch (err) {
      alert(err.message || "Save error");
    } finally {
      setUploading(false);
    }
  };

  const removeHeroPage = async (id) => {
    const res = await fetch(`/api/heroes/${id}`, { method: "DELETE" });
    if (res.ok)
      setHeroPages((prev) => prev.filter((h) => h._id !== id));
    else alert("Failed to delete hero");
  };

  const editHeroPage = (hero) => {
    setHeroTitle(hero.title);
    setHeroSubtitle(hero.subtitle);
    setHeroImage(hero.image || []);
    setHeroBgImage(hero.bgImage || []);
    setCtaText(hero.ctaText || "Shop Now");
    setCtaLink(hero.ctaLink || "/shop/shop");
    setOrder(hero.order || 0);
    setStatus(hero.status || "active");
    setEditId(hero._id);
  };

  const resetForm = () => {
    setHeroTitle("");
    setHeroSubtitle("");
    setHeroImage([]);
    setHeroBgImage([]);
    setCtaText("Shop Now");
    setCtaLink("/shop/shop");
    setOrder(0);
    setStatus("active");
    setEditId(null);
    setHeroProgress(0);
    setHeroBgProgress(0);
    heroImageRef.current.value = null;
    heroBgImageRef.current.value = null;
  };

  const prevHero = () =>
    setCurrentIndex((prev) => (prev === 0 ? heroPages.length - 1 : prev - 1));
  const nextHero = () =>
    setCurrentIndex((prev) => (prev === heroPages.length - 1 ? 0 : prev + 1));

  const currentHero = heroPages[currentIndex] || {};
  const activeHeroCount = heroPages.filter((hero) => hero.status === "active")
    .length;
  const bind = useDrag(
    ({ down, movement: [mx], direction: [xDir], distance, velocity }) => {
      if (!down && distance > 100 && velocity > 0.2)
        xDir < 0 ? nextHero() : prevHero();
    }
  );

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[90rem] space-y-8">
          <section className="shell-panel p-6 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <span className="shell-pill">Campaign studio</span>
                <h1 className="mt-5 text-[var(--mm-ink)]">Hero and promotion setup</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  Curate storefront campaigns, upload optimized hero art, and manage promotional pricing from one setup workspace.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <span className="shell-chip">Hero slides: {heroPages.length}</span>
                <span className="shell-chip">Active slides: {activeHeroCount}</span>
                <span className="shell-chip">
                  Preview: {heroPages.length ? `${currentIndex + 1} of ${heroPages.length}` : "Empty"}
                </span>
              </div>
            </div>
          </section>

          <section className="relative w-full">
            {heroPages.length === 0 ? (
              <div className="shell-panel px-6 py-16 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--mm-muted)]">
                  Hero preview
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-[var(--mm-ink)]">
                  No hero pages yet
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
                  Create your first campaign below to see the storefront preview and carousel controls here.
                </p>
              </div>
            ) : (
              <div className="shell-panel overflow-hidden p-2 sm:p-3">
                <AnimatePresence mode="wait">
                  {currentHero && (
                    <motion.section
                      key={currentHero._id}
                      {...bind()}
                      initial={{ opacity: 0, x: 200 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -200 }}
                      transition={{ duration: 0.5 }}
                      className="relative flex h-[460px] w-full items-center justify-center overflow-hidden rounded-[18px] bg-slate-100"
                    >
                      <div className="absolute inset-0 overflow-hidden">
                        {currentHero.bgImage?.[0]?.full ? (
                          <Image
                            src={currentHero.bgImage[0].full}
                            alt="Hero background"
                            fill
                            unoptimized
                            sizes="100vw"
                            className="object-cover scale-105 blur-sm brightness-95 transition-all duration-700"
                          />
                        ) : (
                          <div className="h-full w-full animate-pulse bg-blue-100" />
                        )}
                        <div className="absolute inset-0 bg-slate-900/45" />
                      </div>

                      <div className="absolute inset-x-6 top-6 flex flex-wrap items-center justify-between gap-3 text-white">
                        <span className="rounded-full border border-white/50 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mm-navy)]">
                          {currentHero.status || "active"}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => editHeroPage(currentHero)}
                            className="rounded-md border border-white bg-white px-4 py-2 text-sm font-semibold text-[var(--mm-navy)] hover:bg-blue-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => removeHeroPage(currentHero._id)}
                            className="rounded-full border border-rose-200/10 bg-rose-500/75 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-10 px-6 py-10 text-white md:flex-row md:px-10">
                        <motion.div
                          initial={{ opacity: 0, y: 40 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6 }}
                          className="hidden flex-1 justify-center md:flex md:justify-start"
                        >
                          <Image
                            src={
                              currentHero.image?.[0]?.full ||
                              "/images/placeholder.PNG"
                            }
                            alt="Model"
                            width={420}
                            height={520}
                            unoptimized
                            className="h-auto w-auto max-w-xs rounded-[28px] object-contain drop-shadow-2xl md:max-w-md"
                          />
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                          className="flex-1 py-6 text-center md:text-left"
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-100/80">
                            Storefront campaign
                          </p>
                          <h1 className="mt-4 font-serif text-4xl font-bold leading-tight text-white drop-shadow-lg md:text-5xl">
                            {currentHero.title}
                          </h1>
                          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-blue-100 md:mx-0 md:text-xl">
                            {currentHero.subtitle}
                          </p>
                          <div className="mt-8">
                            <a
                              href="#"
                              className="inline-flex rounded-full bg-white px-8 py-3 text-sm font-semibold text-[var(--mm-navy)] shadow-lg transition hover:bg-blue-50"
                            >
                              {currentHero.ctaText}
                            </a>
                          </div>
                        </motion.div>
                      </div>

                      {heroPages.length > 1 && (
                        <>
                          <button
                            onClick={prevHero}
                            className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white bg-white text-[var(--mm-navy)] shadow-sm transition hover:bg-blue-50"
                          >
                            &#8592;
                          </button>
                          <button
                            onClick={nextHero}
                            className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white bg-white text-[var(--mm-navy)] shadow-sm transition hover:bg-blue-50"
                          >
                            &#8594;
                          </button>
                        </>
                      )}
                    </motion.section>
                  )}
                </AnimatePresence>
              </div>
            )}
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
            <section className="shell-panel p-6 lg:p-8">
              <div className="mb-6 flex flex-col gap-2 border-b border-white/80 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--mm-muted)]">
                    Hero editor
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-[var(--mm-ink)]">
                    {editId ? "Edit hero" : "Add new hero"}
                  </h2>
                </div>
                <p className="text-sm text-slate-500">Uploads are optimized server-side into full and thumbnail WebP assets.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  placeholder="Hero Title"
                  className="md:col-span-2 !py-3"
                />

                <input
                  type="text"
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  placeholder="Hero Subtitle"
                  className="md:col-span-2 !py-3"
                />

                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="CTA Text"
                  className="!py-3"
                />

                <input
                  type="text"
                  value={ctaLink}
                  onChange={(e) => setCtaLink(e.target.value)}
                  placeholder="CTA Link"
                  className="!py-3"
                />

                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  placeholder="Order"
                  className="!py-3"
                />

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="!py-3"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="mt-6 space-y-4">
                {renderUploader(
                  "Hero Image",
                  heroImageRef,
                  handleHeroImageChange,
                  heroProgress,
                  heroImage,
                  setHeroImage
                )}
                {renderUploader(
                  "Background Image",
                  heroBgImageRef,
                  handleBgImageChange,
                  heroBgProgress,
                  heroBgImage,
                  setHeroBgImage
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={addOrUpdateHeroPage}
                  disabled={uploading}
                  className={`rounded-md px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all ${
                    uploading
                      ? "cursor-not-allowed bg-slate-400"
                      : "bg-[var(--mm-blue)] hover:bg-[var(--mm-blue-dark)]"
                  }`}
                >
                  {uploading ? "Saving..." : editId ? "Update Hero" : "Add Hero"}
                </button>

                {editId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </section>

            <PromotionManagement />
          </div>
        </div>
      </div>
    </Layout>
  );
}

function renderUploader(label, ref, handleChange, progress, images, setImages) {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/72 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--mm-muted)]">
            {label}
          </span>
          <p className="mt-2 text-sm text-slate-500">
            Upload a polished storefront asset for this hero placement.
          </p>
        </div>
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[var(--mm-blue)] hover:bg-blue-50"
        >
          Upload {label}
        </button>
      </div>
      <input
        type="file"
        ref={ref}
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) handleChange(file);
        }}
        className="hidden"
      />
      {progress > 0 && progress < 100 && (
        <div className="mt-4 h-2 w-full rounded-full bg-slate-200/80">
          <div
            className="h-2 rounded-full bg-[var(--mm-blue)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        {images.map((img, idx) => (
          <div key={idx} className="relative overflow-hidden rounded-[22px] border border-white bg-white/90 p-1 shadow-sm">
            <Image
              src={img.full}
              alt={label}
              width={80}
              height={80}
              unoptimized
              className="h-20 w-20 rounded-[18px] object-cover"
            />
            <button
              type="button"
              onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
              className="absolute right-1 top-1 rounded-full bg-rose-500 px-1.5 text-xs text-white"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
