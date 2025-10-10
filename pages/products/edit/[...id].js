import Layout from "@/components/Layout";
import ProductForm from "@/components/ProductForm";
import axios from "axios";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function EditProductPage() {
  const [productInfo, setProductInfo] = useState(null);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (!id) return;
    let active = true;

    axios.get(`/api/products?id=${id}`).then((res) => {
      if (active) setProductInfo(res.data);
    });

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <Layout>
           {productInfo ? (
        // key forces a clean mount when the record changes
        <ProductForm key={productInfo._id} {...productInfo} />
      ) : (
        <div className="text-gray-600">Loading...</div>
      )}
    </Layout>
  );
}
