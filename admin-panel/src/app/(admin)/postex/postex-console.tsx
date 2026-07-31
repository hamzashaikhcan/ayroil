"use client";

import { useState } from "react";
import { TabBar } from "../settings/_shared/tab-bar";
import type { PostexCity, PostexPickupAddress, PostexSettings, PostexShipment } from "@/lib/postex";
import { ShipmentsTab } from "./shipments-tab";
import { PickupAddressesTab } from "./pickup-addresses-tab";
import { CitiesTab } from "./cities-tab";
import { SettingsTab } from "./settings-tab";

type Tab = "shipments" | "pickup-addresses" | "cities" | "settings";

const TABS: { id: Tab; label: string }[] = [
  { id: "shipments", label: "Shipments" },
  { id: "pickup-addresses", label: "Pickup addresses" },
  { id: "cities", label: "Cities" },
  { id: "settings", label: "Settings" },
];

export function PostexConsole({
  initialSettings,
  initialShipments,
  initialPickupAddresses,
  initialCities,
}: {
  initialSettings: PostexSettings | null;
  initialShipments: PostexShipment[];
  initialPickupAddresses: PostexPickupAddress[];
  initialCities: PostexCity[];
}) {
  const [tab, setTab] = useState<Tab>("shipments");
  const [pickupAddresses, setPickupAddresses] = useState(initialPickupAddresses);
  const [defaultPickupAddressCode, setDefaultPickupAddressCode] = useState(
    initialSettings?.postexDefaultPickupAddressCode ?? "",
  );
  const [configured, setConfigured] = useState(initialSettings?.configured ?? false);

  return (
    <div className="space-y-4">
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === "shipments" ? (
        <ShipmentsTab
          initialShipments={initialShipments}
          pickupAddresses={pickupAddresses}
          cities={initialCities}
          defaultPickupAddressCode={defaultPickupAddressCode}
          configured={configured}
        />
      ) : null}

      {tab === "pickup-addresses" ? (
        <PickupAddressesTab
          initialPickupAddresses={pickupAddresses}
          onChange={setPickupAddresses}
          cities={initialCities}
          defaultPickupAddressCode={defaultPickupAddressCode}
          onSetDefault={setDefaultPickupAddressCode}
          configured={configured}
        />
      ) : null}

      {tab === "cities" ? <CitiesTab cities={initialCities} configured={configured} /> : null}

      {tab === "settings" ? (
        <SettingsTab
          initial={initialSettings}
          pickupAddresses={pickupAddresses}
          onDefaultPickupAddressCodeChange={setDefaultPickupAddressCode}
          onConfiguredChange={setConfigured}
        />
      ) : null}
    </div>
  );
}
