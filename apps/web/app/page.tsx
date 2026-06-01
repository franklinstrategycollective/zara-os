import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="space-y-8">
          <p className="text-sm uppercase tracking-widest text-teal-400">
            Pre-launch · EWOR Ideation Fellowship Cohort
          </p>

          <h1 className="text-6xl font-bold leading-tight">
            The operating system <br />
            for the next generation of <br />
            <span className="bg-gradient-to-r from-teal-400 to-purple-400 bg-clip-text text-transparent">
              American healthcare.
            </span>
          </h1>

          <p className="text-xl text-slate-300 max-w-2xl">
            Zara OS replaces Epic-class infrastructure with an AI-native operating system.
            Five specialist agents. FHIR R4 native. Already in production at our founder&apos;s
            24-state telehealth practice.
          </p>

          <div className="flex gap-4 pt-4">
            <Link
              href="/about"
              className="px-6 py-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold transition"
            >
              About the build
            </Link>
            <Link
              href="https://github.com/rjbizsolution23-wq/zara-os"
              className="px-6 py-3 rounded-lg border border-slate-700 hover:border-slate-500 transition"
            >
              View the repo
            </Link>
          </div>

          <div className="pt-16 grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { letter: "P", name: "Post-Visit Autopilot" },
              { letter: "A", name: "AI Scribe" },
              { letter: "Z", name: "Zara Clinical" },
              { letter: "R", name: "Referral Specialist" },
              { letter: "M", name: "Medical Knowledge" },
            ].map((agent) => (
              <div
                key={agent.letter}
                className="p-6 rounded-xl border border-slate-800 bg-slate-900/50"
              >
                <div className="text-4xl font-bold text-teal-400 mb-2">{agent.letter}</div>
                <div className="text-sm text-slate-400">{agent.name}</div>
              </div>
            ))}
          </div>

          <footer className="pt-24 text-sm text-slate-500">
            <p>Built by Dr. Jessica Edwards, DO MBA</p>
            <p>RJ Business Solutions · 1342 NM 333, Tijeras, New Mexico 87059</p>
          </footer>
        </div>
      </div>
    </main>
  );
}
