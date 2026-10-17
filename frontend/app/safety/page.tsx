"use client";

import React from "react";
import {
  PhoneCall,
  AlertOctagon,
  ShieldAlert,
  ExternalLink,
  LifeBuoy,
  HeartHandshake,
  Check,
  X,
} from "lucide-react";

export default function SafetyDirectoryPage() {
  const hotlines = [
    {
      name: "Tele-MANAS (National Mental Health Programme)",
      region: "India",
      number: "14416 / 1800-891-4416",
      desc: "24/7 free, confidential psychological counseling and crisis intervention in 20+ regional Indian languages.",
      url: "https://telemanas.mohfw.gov.in/",
      badge: "India Crisis",
      isEmergency: true,
    },
    {
      name: "National Emergency Helpline",
      region: "India",
      number: "112",
      desc: "Single unified emergency number across India for ambulance, medical, and fire dispatch.",
      url: "https://112.gov.in/",
      badge: "Medical Emergency",
      isEmergency: true,
    },
    {
      name: "KIRAN Mental Health Support",
      region: "India",
      number: "1800-599-0019",
      desc: "Department of Empowerment of Persons with Disabilities toll-free psychological support & rehabilitation.",
      url: "https://depwd.gov.in/",
      badge: "Rehabilitation",
      isEmergency: false,
    },
    {
      name: "988 Suicide & Crisis Lifeline",
      region: "United States",
      number: "988",
      desc: "24/7 free and confidential support for people in suicidal crisis or emotional distress across the US.",
      url: "https://988lifeline.org/",
      badge: "US Lifeline",
      isEmergency: true,
    },
    {
      name: "Emergency Services (Police / Ambulance)",
      region: "United States",
      number: "911",
      desc: "Immediate dispatch for acute medical emergencies and life-threatening conditions.",
      url: "https://www.911.gov/",
      badge: "US Emergency",
      isEmergency: true,
    },
  ];

  const redFlags = [
    {
      sign: "Crushing chest pain, pressure, or tightness radiating to left arm or jaw",
      action: "Call 112 (India) or 911 immediately. Stop activity and sit upright.",
    },
    {
      sign: "Sudden difficulty breathing, gasping for air, or bluish lips",
      action: "Requires emergency medical response; do not wait or attempt self-care.",
    },
    {
      sign: "Sudden facial drooping, arm weakness, or slurred speech (FAST signs)",
      action: "Possible stroke event. Immediate emergency ambulance required.",
    },
    {
      sign: "Active thoughts of self-harm, wanting to die, or intense emotional distress",
      action: "Call Tele-MANAS (14416) or 988. Free 24/7 compassionate human support.",
    },
    {
      sign: "Swollen tongue, throat tightness, or difficulty swallowing (Anaphylaxis)",
      action: "Severe allergic reaction. Seek immediate emergency epinephrine/care.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-10">
      {/* Header */}
      <div className="border-b border-subtle pb-4">
        <h1 className="font-serif text-3xl font-bold text-forest-950 flex items-center gap-2.5">
          <LifeBuoy className="w-7 h-7 text-coral-600" />
          Safety Boundaries & Crisis Directory
        </h1>
        <p className="text-sm text-ink-700 mt-1">
          Verified emergency contacts, red flag warning signs, and transparent clinical boundaries.
        </p>
      </div>

      {/* Emergency Hotline Directory */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-forest-950">
            Official Emergency & Crisis Contacts
          </h2>
          <span className="text-xs text-ink-500">Verified official lines</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hotlines.map((h, i) => (
            <div
              key={i}
              className={`p-5 rounded-2xl border space-y-3 shadow-soft ${
                h.isEmergency
                  ? "bg-coral-50/60 border-coral-200"
                  : "bg-warm-50 border-warm-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-forest-950">{h.name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-warm-200/70 text-ink-800">
                  {h.region}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xl font-bold text-coral-700">
                <PhoneCall className="w-5 h-5 shrink-0" />
                <span>{h.number}</span>
              </div>

              <p className="text-xs text-ink-700 leading-relaxed">{h.desc}</p>

              <div className="pt-2 border-t border-subtle">
                <a
                  href={h.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-forest-800 hover:underline inline-flex items-center gap-1"
                >
                  Official Portal
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Red Flag Warning Signs Table */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-forest-950 flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-coral-600" />
          Acute Red Flag Signs: When to Seek Immediate Care
        </h2>
        <p className="text-xs text-ink-700">
          The following symptoms should NEVER be managed through self-care or digital wellness advice:
        </p>

        <div className="overflow-hidden rounded-2xl border border-warm-200 bg-warm-50 shadow-soft">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-warm-100/80 border-b border-warm-200 text-forest-950 font-bold">
                <th className="p-3.5">Red Flag Warning Symptom</th>
                <th className="p-3.5">Immediate Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-200/60 text-ink-800">
              {redFlags.map((rf, idx) => (
                <tr key={idx} className="hover:bg-warm-100/30">
                  <td className="p-3.5 font-medium text-coral-950 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-coral-500 mt-1.5 shrink-0" />
                    {rf.sign}
                  </td>
                  <td className="p-3.5 text-forest-900 font-semibold">{rf.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Explicit Support Boundaries */}
      <section className="p-6 rounded-2xl bg-warm-50 border border-warm-200 shadow-soft space-y-4">
        <h2 className="font-serif text-xl font-bold text-forest-950">
          WellSpring AI Service Boundaries
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-forest-50/70 border border-forest-200 space-y-2">
            <h4 className="font-bold text-forest-950 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-forest-700" />
              What WellSpring AI Provides
            </h4>
            <ul className="space-y-1.5 text-ink-800">
              <li>• Everyday sleep hygiene education and wind-down routines.</li>
              <li>• Non-invasive stress relaxation habits (e.g. diaphragmatic pacing).</li>
              <li>• Desk ergonomics, screen fatigue, and posture reminders.</li>
              <li>• Hydration tracking and healthy movement scheduling.</li>
              <li>• Grounded citations to peer-reviewed health databases.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-coral-50/60 border border-coral-200 space-y-2">
            <h4 className="font-bold text-coral-950 flex items-center gap-1.5">
              <X className="w-4 h-4 text-coral-700" />
              What WellSpring AI Does NOT Do
            </h4>
            <ul className="space-y-1.5 text-coral-900">
              <li>• Does NOT diagnose illness or clinical conditions.</li>
              <li>• Does NOT prescribe drugs or adjust pharmaceutical doses.</li>
              <li>• Does NOT manage acute emergencies or severe trauma.</li>
              <li>• Does NOT substitute for direct clinical examination by a physician.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
