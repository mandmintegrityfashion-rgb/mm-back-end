import Layout from "@/components/Layout";
import ProductForm from "@/components/ProductForm";

export default function Products() {
  return (
    <Layout>
      <div className="flex items-center justify-between mb-6 w-full">
            <h2 className="text-xl font-semibold">Add a Product</h2>
          </div>
      <ProductForm />
    </Layout>
  );
}
