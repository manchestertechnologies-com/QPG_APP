import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Search,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Tag,
  BookOpen,
  Layers,
} from 'lucide-react';
import { api } from '../services/apiClient';

interface ConceptsSelectionStepProps {
  selectedChapters: string[];
  selectedConcepts: string[];
  onSelectConcepts: (concepts: string[]) => void;
  onBack: () => void;
  onProceed: () => void;
  userSubject: string;
}

// Rich default concepts covering syllabus chapters
const CHAPTER_CONCEPTS_MAP: Record<string, { tag: string; count: number }[]> = {
  'Some Basic Concepts of Chemistry': [
    { tag: 'Mole Concept & Molar Mass Calculations', count: 68 },
    { tag: 'Stoichiometry & Limiting Reagent', count: 54 },
    { tag: 'Empirical & Molecular Formula Determination', count: 42 },
    { tag: 'Concentration Terms (Molarity, Molality, Mole Fraction)', count: 62 },
  ],
  'Structure of Atom': [
    { tag: 'Bohr Model & Hydrogen Spectrum (Rydberg Formula)', count: 72 },
    { tag: 'de Broglie Wavelength & Dual Nature of Matter', count: 48 },
    { tag: 'Heisenberg Uncertainty Principle', count: 38 },
    { tag: 'Quantum Numbers & Electronic Configuration (Aufbau, Hund)', count: 86 },
    { tag: 'Photoelectric Effect & Planck Quantum Theory', count: 44 },
  ],
  'Classification of Elements & Periodicity': [
    { tag: 'Modern Periodic Law & Group/Period Trends', count: 58 },
    { tag: 'Ionization Enthalpy & Electron Gain Enthalpy', count: 64 },
    { tag: 'Electronegativity (Pauling Scale) & Atomic Radii', count: 52 },
    { tag: 'Anomalous Properties of Second Period Elements', count: 32 },
  ],
  'Chemical Bonding & Molecular Structure': [
    { tag: 'VSEPR Theory & Molecular Geometry', count: 78 },
    { tag: 'Hybridization ($sp, sp^2, sp^3, sp^3d, sp^3d^2$)', count: 92 },
    { tag: 'Molecular Orbital Theory & Bond Order Calculations', count: 84 },
    { tag: 'Dipole Moment & Percentage Ionic Character (Fajan Rules)', count: 46 },
    { tag: 'Hydrogen Bonding & Intermolecular Forces', count: 38 },
  ],
  'Thermodynamics & Thermochemistry': [
    { tag: 'First Law of Thermodynamics & Internal Energy ($q, w, \\Delta U$)', count: 68 },
    { tag: 'Enthalpy Changes & Hess\'s Law of Constant Heat Summation', count: 74 },
    { tag: 'Entropy ($\\Delta S$) & Second Law of Thermodynamics', count: 56 },
    { tag: 'Gibbs Free Energy ($\\Delta G$) & Spontaneity Criteria', count: 82 },
    { tag: 'Standard Enthalpy of Formation, Combustion & Bond Enthalpies', count: 50 },
  ],
  'Equilibrium (Chemical & Ionic)': [
    { tag: 'Law of Mass Action, $K_p$ and $K_c$ Relationships', count: 62 },
    { tag: 'Le Chatelier\'s Principle & Equilibrium Shifts', count: 70 },
    { tag: 'pH Calculations of Strong and Weak Acids/Bases', count: 86 },
    { tag: 'Buffer Solutions (Henderson-Hasselbalch Equation)', count: 68 },
    { tag: 'Solubility Product ($K_{sp}$) & Common Ion Effect', count: 72 },
  ],
  'Redox Reactions': [
    { tag: 'Oxidation Number Rules & Assigning Oxidation States', count: 52 },
    { tag: 'Balancing Redox Equations (Ion-Electron & Oxidation Number Methods)', count: 64 },
    { tag: 'Types of Redox Reactions (Disproportionation, Displacement)', count: 42 },
    { tag: 'Electrochemical Series & Oxidizing/Reducing Power', count: 48 },
  ],
  'Organic Chemistry: Basic Principles & Techniques': [
    { tag: 'IUPAC Nomenclature of Polyfunctional Compounds', count: 76 },
    { tag: 'Electronic Effects (Inductive, Resonance, Hyperconjugation)', count: 88 },
    { tag: 'Carbocation, Carbanion & Free Radical Stability', count: 72 },
    { tag: 'Structural Isomerism & Stereoisomerism (Geometrical & Optical)', count: 82 },
    { tag: 'Electrophiles, Nucleophiles & Reaction Intermediates', count: 46 },
  ],
  'Hydrocarbons': [
    { tag: 'Electrophilic Addition to Alkenes (Markovnikov & Anti-Markovnikov)', count: 76 },
    { tag: 'Ozonolysis of Alkenes & Structure Elucidation', count: 58 },
    { tag: 'Acidity of Terminal Alkynes & Addition Reactions', count: 44 },
    { tag: 'Aromaticity (Hückel\'s $4n+2$ Rule)', count: 52 },
    { tag: 'Electrophilic Aromatic Substitution (Nitration, Friedel-Crafts)', count: 80 },
  ],
  'Solutions': [
    { tag: 'Raoult\'s Law for Volatile & Non-Volatile Solutes', count: 68 },
    { tag: 'Colligative Properties (Boiling Point Elevation, Freezing Depression)', count: 84 },
    { tag: 'Osmotic Pressure & Reverse Osmosis Calculations', count: 56 },
    { tag: 'Van \'t Hoff Factor ($i$) & Degree of Dissociation/Association', count: 92 },
    { tag: 'Ideal & Non-Ideal Solutions (Positive/Negative Deviations)', count: 48 },
  ],
  'Electrochemistry': [
    { tag: 'Nernst Equation & Cell Potential ($E_{cell}, E^\\circ_{cell}$)', count: 96 },
    { tag: 'Molar Conductivity ($\\Lambda_m$) & Kohlrausch\'s Law', count: 74 },
    { tag: 'Faraday\'s Laws of Electrolysis & Quantitative Analysis', count: 64 },
    { tag: 'Electrochemical Cells vs Electrolytic Cells & Batteries', count: 42 },
    { tag: 'Standard Hydrogen Electrode (SHE) & Gibbs Energy ($\\Delta G^\\circ = -nFE^\\circ$)', count: 70 },
  ],
  'Chemical Kinetics': [
    { tag: 'Rate Law, Order and Molecularity of Reaction', count: 68 },
    { tag: 'Integrated Rate Equations for Zero and First-Order Reactions', count: 92 },
    { tag: 'Half-Life Period ($t_{1/2}$) & Graphical Representations', count: 78 },
    { tag: 'Arrhenius Equation & Activation Energy ($E_a$)', count: 84 },
    { tag: 'Collision Theory & Pseudo First-Order Reactions', count: 40 },
  ],
  'The d- and f-Block Elements': [
    { tag: 'Electronic Configuration & Variable Oxidation States of 3d Series', count: 62 },
    { tag: 'Magnetic Properties (Spin-Only Formula $\\mu = \\sqrt{n(n+2)}$)', count: 68 },
    { tag: 'Catalytic Properties, Interstitial Compounds & Alloy Formation', count: 44 },
    { tag: 'Preparation & Properties of $KMnO_4$ and $K_2Cr_2O_7$', count: 56 },
    { tag: 'Lanthanoid Contraction & Consequences on Radii', count: 52 },
  ],
  'Coordination Compounds': [
    { tag: 'Werner\'s Coordination Theory & Primary/Secondary Valencies', count: 48 },
    { tag: 'IUPAC Nomenclature of Coordination Complexes', count: 72 },
    { tag: 'Isomerism (Geometrical, Optical, Linkage, Coordination)', count: 80 },
    { tag: 'Valence Bond Theory (Inner & Outer Orbital Complexes)', count: 76 },
    { tag: 'Crystal Field Theory (CFSE & Spectrochemical Series)', count: 94 },
  ],
  'Haloalkanes & Haloarenes': [
    { tag: '$S_N1$ and $S_N2$ Mechanisms & Stereochemical Inversion', count: 92 },
    { tag: 'Elimination Reactions (Saytzeff Rule vs Hofmann Rule)', count: 58 },
    { tag: 'Nucleophilic Aromatic Substitution in Haloarenes', count: 46 },
    { tag: 'Organometallic Compounds (Grignard Reagents Preparation & Reactions)', count: 64 },
  ],
  'Alcohols, Phenols & Ethers': [
    { tag: 'Mechanism of Acid-Catalyzed Hydration & Dehydration of Alcohols', count: 74 },
    { tag: 'Lucas Test & Distinction Between $1^\\circ, 2^\\circ, 3^\\circ$ Alcohols', count: 56 },
    { tag: 'Acidity of Phenols & Resonance Stabilization of Phenoxide Ion', count: 62 },
    { tag: 'Kolbe Reaction & Reimer-Tiemann Reaction', count: 68 },
    { tag: 'Williamson Ether Synthesis & Cleavage of Ethers with $HI$', count: 70 },
  ],
  'Aldehydes, Ketones & Carboxylic Acids': [
    { tag: 'Nucleophilic Addition Mechanisms (HCN, $NaHSO_3$, Grignard)', count: 82 },
    { tag: 'Aldol Condensation & Cross-Aldol Reactions', count: 88 },
    { tag: 'Cannizzaro Reaction & Mechanism', count: 64 },
    { tag: 'Tests to Distinguish Aldehydes (Tollens\', Fehling\'s, Iodoform)', count: 76 },
    { tag: 'Acidity of Carboxylic Acids & Effect of Substituents', count: 70 },
  ],
  'Amines & Diazonium Salts': [
    { tag: 'Basicity of Aliphatic and Aromatic Amines in Aqueous/Gas Phase', count: 78 },
    { tag: 'Gabriel Phthalimide Synthesis & Hoffmann Bromamide Reaction', count: 66 },
    { tag: 'Carbylamine Test & Hinsberg Test for Distinction', count: 60 },
    { tag: 'Diazotization & Sandmeyer / Gattermann Reactions', count: 74 },
    { tag: 'Azo Dye Coupling Reactions of Diazonium Salts', count: 48 },
  ],
  'Biomolecules': [
    { tag: 'Classification of Carbohydrates & Glucose Cyclic Structures', count: 54 },
    { tag: 'Reducing and Non-Reducing Sugars (Glycosidic Linkage)', count: 46 },
    { tag: 'Amino Acids (Zwitterions) & Peptide Bond Formation', count: 60 },
    { tag: 'Primary, Secondary, Tertiary Structure of Proteins & Denaturation', count: 64 },
    { tag: 'Nucleic Acids (DNA vs RNA, Purine/Pyrimidine Bases)', count: 58 },
  ],
};

export const ConceptsSelectionStep: React.FC<ConceptsSelectionStepProps> = ({
  selectedChapters,
  selectedConcepts,
  onSelectConcepts,
  onBack,
  onProceed,
  userSubject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChapterFilter, setActiveChapterFilter] = useState<string>('all');

  // Real topics from the teacher's own question bank, per selected chapter.
  // The static map is only a fallback when the server can't be reached.
  const [availableConcepts, setAvailableConcepts] = useState<{ chapter: string; tag: string; count: number }[]>([]);
  const [loadingConcepts, setLoadingConcepts] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingConcepts(true);
    Promise.all(
      selectedChapters.map(async (ch) => {
        let concepts: { tag: string; count: number }[] = [];
        try {
          const res: any = await api.getConcepts(ch);
          if (res && Array.isArray(res.concepts) && !res.offline) concepts = res.concepts;
        } catch {
          /* fall back below */
        }
        if (concepts.length === 0) {
          concepts = CHAPTER_CONCEPTS_MAP[ch] || [{ tag: `${ch} (all topics)`, count: 0 }];
        }
        return concepts.map((c) => ({ chapter: ch, tag: c.tag, count: c.count }));
      })
    ).then((parts) => {
      if (cancelled) return;
      // A topic name can repeat across chapters; keep the first occurrence so tags stay unique.
      const seen = new Set<string>();
      setAvailableConcepts(parts.flat().filter((c) => (seen.has(c.tag) ? false : (seen.add(c.tag), true))));
      setLoadingConcepts(false);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedChapters]);

  // Pre-select all concepts if none selected yet
  useEffect(() => {
    if (availableConcepts.length === 0) return;
    const valid = selectedConcepts.filter((t) => availableConcepts.some((c) => c.tag === t));
    if (valid.length === 0) onSelectConcepts(availableConcepts.map((c) => c.tag));
    else if (valid.length !== selectedConcepts.length) onSelectConcepts(valid);
  }, [availableConcepts]);

  // Filtered concepts by search and active chapter
  const filteredConcepts = useMemo(() => {
    return availableConcepts.filter((c) => {
      const matchesSearch = c.tag.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchesChapter = activeChapterFilter === 'all' || c.chapter === activeChapterFilter;
      return matchesSearch && matchesChapter;
    });
  }, [availableConcepts, searchQuery, activeChapterFilter]);

  const toggleConcept = (tag: string) => {
    if (selectedConcepts.includes(tag)) {
      onSelectConcepts(selectedConcepts.filter((t) => t !== tag));
    } else {
      onSelectConcepts([...selectedConcepts, tag]);
    }
  };

  const handleSelectAll = () => {
    const tagsInView = filteredConcepts.map((c) => c.tag);
    const merged = Array.from(new Set([...selectedConcepts, ...tagsInView]));
    onSelectConcepts(merged);
  };

  const handleClearAll = () => {
    if (activeChapterFilter === 'all') {
      onSelectConcepts([]);
    } else {
      const tagsInCurrentChapter = availableConcepts
        .filter((c) => c.chapter === activeChapterFilter)
        .map((c) => c.tag);
      onSelectConcepts(selectedConcepts.filter((t) => !tagsInCurrentChapter.includes(t)));
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header with Top Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 rounded-xl border border-line bg-field hover:bg-ink/[0.06] px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-ink hover:border-gold/40 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Return to Chapters Selection"
            >
              <ArrowLeft className="h-4 w-4 text-gold" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold text-gold uppercase tracking-wider font-heading">
              <span>Step 3 • Syllabus Micro-Concepts</span>
            </div>
          </div>
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-ink font-heading">
            Select Syllabus Concepts
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Refine the exact core topics and micro-concepts from your chosen{' '}
            <strong className="text-ink">{selectedChapters.length}</strong> chapters for {userSubject}.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-line bg-card px-3.5 py-2 text-xs text-slate-600">
          <Tag className="h-4 w-4 text-gold" />
          <span>
            <strong className="text-ink">{selectedConcepts.length}</strong> Active Concepts
          </span>
        </div>
      </div>

      {/* Chapter Filter Pills & Search */}
      <div className="rounded-2xl border border-line bg-card p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Chapter Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveChapterFilter('all')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeChapterFilter === 'all'
                  ? 'bg-ink text-gold-soft font-bold shadow'
                  : 'bg-ink/[0.04] text-slate-500 hover:text-ink'
              }`}
            >
              All Chapters ({availableConcepts.length})
            </button>
            {selectedChapters.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setActiveChapterFilter(ch)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer truncate max-w-[200px] ${
                  activeChapterFilter === ch
                    ? 'bg-ink text-gold-soft font-bold shadow'
                    : 'bg-ink/[0.04] text-slate-500 hover:text-ink'
                }`}
                title={ch}
              >
                {ch}
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="rounded-xl border border-line bg-field px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-gold/40 transition-colors cursor-pointer whitespace-nowrap"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="rounded-xl border border-line bg-field px-3 py-1.5 text-[11px] font-semibold text-slate-500 hover:text-red-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search micro-concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-line bg-field pl-10 pr-4 py-2.5 text-xs text-ink placeholder-slate-400 focus:border-gold focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Concepts List Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {filteredConcepts.length} concepts •{' '}
            <strong className="text-gold">{selectedConcepts.length}</strong> selected
          </span>
          <span className="text-[11px] text-slate-500">
            Click any concept pill to toggle inclusion
          </span>
        </div>

        {loadingConcepts && (
          <div className="py-6 text-center text-xs text-slate-500">Loading topics from your {userSubject} question bank…</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredConcepts.map((item) => {
            const isSelected = selectedConcepts.includes(item.tag);
            return (
              <div
                key={item.tag}
                onClick={() => toggleConcept(item.tag)}
                className={`relative flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-gold bg-card shadow-md shadow-gold/10 ring-1 ring-gold/40'
                    : 'border-line bg-card/70 hover:border-line-strong hover:bg-card'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition-all ${
                    isSelected
                      ? 'border-gold bg-gold-btn text-ink'
                      : 'border-line-strong bg-ink/[0.04]'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="h-3 w-3 stroke-[3]" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[9px] font-bold text-gold truncate mb-0.5 uppercase tracking-wide">
                    {item.chapter}
                  </div>
                  <h4
                    className={`text-xs font-semibold leading-relaxed line-clamp-2 ${
                      isSelected ? 'text-ink' : 'text-slate-600'
                    }`}
                  >
                    {item.tag}
                  </h4>
                  <div className="mt-1 text-[10px] text-slate-500">
                    ~{item.count} questions in bank
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="sticky bottom-0 z-30 flex items-center justify-between rounded-2xl border border-line bg-paper/95 p-4 shadow-2xl backdrop-blur-xl">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-line bg-field px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-ink hover:border-line-strong transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Chapters</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <Tag className="h-4 w-4 text-gold" />
          <span>
            <strong className="text-ink">{selectedConcepts.length}</strong> Concepts Activated
          </span>
        </div>

        <button
          type="button"
          onClick={onProceed}
          disabled={selectedConcepts.length === 0}
          className="glow-button flex items-center gap-2 px-5 py-3 text-xs font-black text-ink transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Next: Choose Assembly Mode</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
