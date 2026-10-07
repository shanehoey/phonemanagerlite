"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [counts, setCounts] = useState({ firmware: 0, config: 0, redirects: 0, models: 0 });

  useEffect(() => {
    async function loadCounts() {
      try {
        const [firmwareResponse, configResponse, modelsResponse] = await Promise.all([
          fetch("/api/phonemanager/redirects?list=1"),
          fetch("/api/phonemanager/config?list=1"),
          fetch("/api/phonemanager/models"),
        ]);

        const firmwareData = await firmwareResponse.json();
        const configData = await configResponse.json();
        const modelsData = await modelsResponse.json();

        setCounts({
          firmware: Array.isArray(firmwareData.files) ? firmwareData.files.length : 0,
          config: Array.isArray(configData.files) ? configData.files.length : 0,
          redirects: firmwareData.redirects && typeof firmwareData.redirects === "object"
            ? Object.keys(firmwareData.redirects).length
            : 0,
          models: Array.isArray(modelsData.models) ? modelsData.models.length : 0,
        });
      } catch (error) {
        console.error("Failed to load dashboard counts", error);
      }
    }

    loadCounts();
  }, []);

  return (
    <>
      <section className="grid gap-4 md:grid-cols-4">


        <article className="rounded-xl border border-green-200  p-4 shadow-lg">
          <p className="text-sm ">Hardware Models</p>
          <p className="text-3xl text-green-700 font-semibold">{counts.models}</p>
        </article>

        <article className="rounded-xl border border-green-200 p-4 shadow-lg">
          <p className="text-sm ">Firmware Files</p>
          <p className="text-3xl text-green-700 font-semibold">{counts.firmware}</p>
        </article>



        <article className="rounded-xl border border-green-200  p-4 shadow-lg">
          <p className="text-sm ">Redirects</p>
          <p className="text-3xl text-green-700 font-semibold">{counts.redirects}</p>
        </article>


        <article className="rounded-xl border border-green-200  p-4 shadow-lg">
          <p className="text-sm ">Configuration Files</p>
          <p className="text-3xl text-green-700 font-semibold">{counts.config}</p>
        </article>

      </section>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Quick start</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Use the steps below to set up files and redirects for your phones.
        </p>

        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-200">
          <li>Open Hardware and add the model aliases your phones request (for example 405HD.img).</li>
          <li>Open Firmware and upload firmware files into the correct folder (sip, teams, or sipgateway).</li>
          <li>Open Redirects and map each model alias to a firmware file target.</li>
          <li>Open Configuration and upload baseline config files as needed.</li>
          <li>Test from a phone by requesting firmware and verify it resolves to the expected file.</li>
        </ol>
      </section>
    </>

  );
}
