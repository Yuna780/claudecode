import { createClient } from "@/lib/supabase/server";
import ExhibitionCard from "@/components/exhibitions/ExhibitionCard";
import { Exhibition } from "@/lib/types";

export default async function ExhibitionsPage() {
  const supabase = await createClient();
  const { data: exhibitions } = await supabase
    .from("exhibitions")
    .select("*")
    .order("start_date", { ascending: false });

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">展覧会一覧</h1>
        <p className="text-gray-500 mt-2">感想を共有したい展覧会を選んでください</p>
      </div>
      {exhibitions && exhibitions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {exhibitions.map((ex) => (
            <ExhibitionCard key={ex.id} exhibition={ex as Exhibition} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🖼</p>
          <p>展覧会が登録されていません</p>
        </div>
      )}
    </div>
  );
}
