import { PageHeader } from "@/components/ui/page-header";
import { fetchPostexSettings, fetchPostexShipments, fetchPostexPickupAddresses, fetchPostexCities } from "@/lib/postex";
import { PostexConsole } from "./postex-console";

export default async function PostexPage() {
  const [settings, shipments, pickupAddresses, cities] = await Promise.all([
    fetchPostexSettings(),
    fetchPostexShipments(),
    fetchPostexPickupAddresses(),
    fetchPostexCities(),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="PostEx"
        subtitle="Book, track, and manage COD shipments with PostEx — Pakistan's courier network."
      />
      <PostexConsole
        initialSettings={settings}
        initialShipments={shipments}
        initialPickupAddresses={pickupAddresses}
        initialCities={cities}
      />
    </div>
  );
}
