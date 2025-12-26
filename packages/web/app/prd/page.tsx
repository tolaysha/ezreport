'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import {
  ConsolePanel,
  ConsoleHeading,
  Breadcrumb,
  BackendStatus,
} from '@/components/console';
import { useColor } from '@/lib/colorContext';

// =============================================================================
// Types based on shared/types/prd.ts
// =============================================================================

interface IntentVector {
  intentId: string;
  subject: string;
  tensionAxis: string;
  hypothesizedLeverage: string;
  desiredDirection: string;
}

type ResearchQuestionType = 'validation' | 'boundary' | 'failure';

interface ResearchQuestion {
  rqId: string;
  relatedIntentId: string;
  questionType: ResearchQuestionType;
  question: string;
  invalidationCriteria: string;
}

type ConfidenceLevel = 'low' | 'medium' | 'high';

interface Finding {
  findingId: string;
  relatedRqId: string;
  statement: string;
  confidenceLevel: ConfidenceLevel;
  isAssumed: boolean;
}

interface ProductTruth {
  truthId: string;
  derivedFromFindingIds: string[];
  truthStatement: string;
}

interface DesignPrinciple {
  principleId: string;
  derivedFromTruthId: string;
  ifCondition: string;
  thenBehavior: string;
}

type PriorityType = 'must' | 'should' | 'wont';

interface ProductRequirement {
  requirementId: string;
  derivedFromPrincipleId: string;
  requirementText: string;
  priority: PriorityType;
}

interface QualityCheckWarning {
  type: string;
  message: string;
  itemIds: string[];
}

interface PRDGenerationResult {
  productGoal: string;
  intentVectors: IntentVector[];
  researchQuestions: ResearchQuestion[];
  findings: Finding[];
  productTruths: ProductTruth[];
  designPrinciples: DesignPrinciple[];
  productRequirements: ProductRequirement[];
  qualityWarnings: QualityCheckWarning[];
  generatedAt: string;
}

// =============================================================================
// API Client
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

async function generatePRD(productGoal: string): Promise<{ result: PRDGenerationResult | null; error?: string; logs: string[] }> {
  const response = await fetch(`${API_BASE_URL}/api/generate-prd`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productGoal }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}${errorText ? ' - ' + errorText : ''}`
    );
  }

  return response.json();
}

// =============================================================================
// Pipeline Stage Component
// =============================================================================

interface PipelineStageProps {
  icon: string;
  title: string;
  count: number;
  isActive: boolean;
  isComplete: boolean;
}

function PipelineStage({ icon, title, count, isActive, isComplete }: PipelineStageProps) {
  const { colorScheme } = useColor();
  
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded transition-all ${
      isActive 
        ? `${colorScheme.accent} text-black` 
        : isComplete 
          ? `${colorScheme.border}/30 ${colorScheme.primary}`
          : 'border border-zinc-800 text-zinc-600'
    }`}>
      <span className="text-sm">{icon}</span>
      <span className="font-mono text-xs uppercase">{title}</span>
      {count > 0 && (
        <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${
          isActive ? 'bg-black/20' : isComplete ? `${colorScheme.accent}/20` : 'bg-zinc-800'
        }`}>
          {count}
        </span>
      )}
    </div>
  );
}

// =============================================================================
// Expandable Section Component
// =============================================================================

interface ExpandableSectionProps {
  title: string;
  icon: string;
  count: number;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function ExpandableSection({ title, icon, count, children, defaultExpanded = false }: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { colorScheme } = useColor();

  return (
    <div className={`border ${colorScheme.border}/20 rounded-lg overflow-hidden`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center gap-3 px-4 py-3 ${colorScheme.accent}/5 hover:${colorScheme.accent}/10 transition-colors`}
      >
        <span className="text-lg">{icon}</span>
        <span className={`font-mono text-sm font-bold ${colorScheme.secondary} uppercase tracking-wide flex-1 text-left`}>
          {title}
        </span>
        <span className={`font-mono text-xs ${colorScheme.primary} opacity-60 px-2 py-0.5 rounded ${colorScheme.accent}/10`}>
          {count}
        </span>
        <span className={`${colorScheme.primary} opacity-60 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
          ▶
        </span>
      </button>
      {isExpanded && (
        <div className={`px-4 py-4 border-t ${colorScheme.border}/10 space-y-3`}>
          {children}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Result Cards
// =============================================================================

function IntentVectorCard({ intent }: { intent: IntentVector }) {
  const { colorScheme } = useColor();
  return (
    <div className={`p-3 rounded ${colorScheme.accent}/5 border ${colorScheme.border}/10`}>
      <div className={`font-mono text-xs ${colorScheme.primary} opacity-50 mb-1`}>{intent.intentId}</div>
      <div className={`font-mono text-sm ${colorScheme.secondary} font-bold mb-2`}>{intent.subject}</div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className={`${colorScheme.primary} opacity-50`}>tension:</span>
          <div className={`${colorScheme.primary} opacity-80`}>{intent.tensionAxis}</div>
        </div>
        <div>
          <span className={`${colorScheme.primary} opacity-50`}>leverage:</span>
          <div className={`${colorScheme.primary} opacity-80`}>{intent.hypothesizedLeverage}</div>
        </div>
        <div>
          <span className={`${colorScheme.primary} opacity-50`}>direction:</span>
          <div className={`${colorScheme.primary} opacity-80`}>{intent.desiredDirection}</div>
        </div>
      </div>
    </div>
  );
}

function ResearchQuestionCard({ rq }: { rq: ResearchQuestion }) {
  const { colorScheme } = useColor();
  const typeColors = {
    validation: 'text-green-400 bg-green-500/10',
    boundary: 'text-amber-400 bg-amber-500/10',
    failure: 'text-red-400 bg-red-500/10',
  };
  return (
    <div className={`p-3 rounded ${colorScheme.accent}/5 border ${colorScheme.border}/10`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`font-mono text-xs ${colorScheme.primary} opacity-50`}>{rq.rqId}</span>
        <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${typeColors[rq.questionType]}`}>
          {rq.questionType}
        </span>
      </div>
      <div className={`font-mono text-sm ${colorScheme.secondary} mb-2`}>{rq.question}</div>
      <div className={`font-mono text-xs ${colorScheme.primary} opacity-50`}>
        ✗ {rq.invalidationCriteria}
      </div>
    </div>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  const { colorScheme } = useColor();
  const confidenceColors = {
    low: 'text-red-400 bg-red-500/10',
    medium: 'text-amber-400 bg-amber-500/10',
    high: 'text-green-400 bg-green-500/10',
  };
  return (
    <div className={`p-3 rounded ${colorScheme.accent}/5 border ${colorScheme.border}/10`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`font-mono text-xs ${colorScheme.primary} opacity-50`}>{finding.findingId}</span>
        <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${confidenceColors[finding.confidenceLevel]}`}>
          {finding.confidenceLevel}
        </span>
        {finding.isAssumed && (
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded text-purple-400 bg-purple-500/10">
            assumed
          </span>
        )}
      </div>
      <div className={`font-mono text-sm ${colorScheme.secondary}`}>{finding.statement}</div>
    </div>
  );
}

function TruthCard({ truth }: { truth: ProductTruth }) {
  const { colorScheme } = useColor();
  return (
    <div className={`p-3 rounded ${colorScheme.accent}/5 border ${colorScheme.border}/10`}>
      <div className={`font-mono text-xs ${colorScheme.primary} opacity-50 mb-1`}>{truth.truthId}</div>
      <div className={`font-mono text-sm ${colorScheme.secondary} font-bold`}>{truth.truthStatement}</div>
    </div>
  );
}

function PrincipleCard({ principle }: { principle: DesignPrinciple }) {
  const { colorScheme } = useColor();
  return (
    <div className={`p-3 rounded ${colorScheme.accent}/5 border ${colorScheme.border}/10`}>
      <div className={`font-mono text-xs ${colorScheme.primary} opacity-50 mb-2`}>{principle.principleId}</div>
      <div className={`font-mono text-sm ${colorScheme.secondary}`}>
        <span className="text-cyan-400">IF</span> {principle.ifCondition}
      </div>
      <div className={`font-mono text-sm ${colorScheme.secondary}`}>
        <span className="text-purple-400">THEN</span> {principle.thenBehavior}
      </div>
    </div>
  );
}

function RequirementCard({ req }: { req: ProductRequirement }) {
  const { colorScheme } = useColor();
  const priorityColors = {
    must: 'text-red-400 bg-red-500/10 border-red-500/30',
    should: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    wont: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30',
  };
  return (
    <div className={`p-3 rounded border ${priorityColors[req.priority]}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`font-mono text-xs ${colorScheme.primary} opacity-50`}>{req.requirementId}</span>
        <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${priorityColors[req.priority]}`}>
          {req.priority.toUpperCase()}
        </span>
      </div>
      <div className={`font-mono text-sm ${colorScheme.secondary}`}>{req.requirementText}</div>
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function PRDPage() {
  const { colorScheme } = useColor();
  const [productGoal, setProductGoal] = useState('');
  const [result, setResult] = useState<PRDGenerationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCursor, setShowCursor] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleGenerate = async () => {
    if (!productGoal.trim()) {
      setError('Product Goal is required');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setLogs([]);

    try {
      const response = await generatePRD(productGoal.trim());
      if (response.error) {
        setError(response.error);
      } else if (response.result) {
        setResult(response.result);
      }
      if (response.logs) {
        setLogs(response.logs);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.metaKey && !isGenerating) {
      handleGenerate();
    }
  };

  const pipelineStages = result ? [
    { icon: '🎯', title: 'Intents', count: result.intentVectors.length },
    { icon: '❓', title: 'Questions', count: result.researchQuestions.length },
    { icon: '📊', title: 'Findings', count: result.findings.length },
    { icon: '💎', title: 'Truths', count: result.productTruths.length },
    { icon: '⚙️', title: 'Principles', count: result.designPrinciples.length },
    { icon: '📋', title: 'Requirements', count: result.productRequirements.length },
  ] : [];

  return (
    <div 
      className={`min-h-screen ${colorScheme.bg} p-4 md:p-8`}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumb items={[{ label: 'prd' }]} />
          <ConsoleHeading level={1}>
            PRD Generator
          </ConsoleHeading>
          <p className={`${colorScheme.primary} opacity-60 font-mono text-sm mt-2`}>
            Goal → Intents → Questions → Findings → Truths → Principles → Requirements
          </p>
        </div>

        {/* Input Panel */}
        <ConsolePanel className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <ConsoleHeading level={2}>[ PRODUCT GOAL ]</ConsoleHeading>
            <BackendStatus />
          </div>

          <div className={`bg-black/50 border ${colorScheme.border}/30 p-4 font-mono`}>
            <div className={`${colorScheme.primary} opacity-50 text-sm mb-3`}>
              Define your product goal. Be specific about the outcome you want to achieve.
            </div>
            
            <div className="relative">
              <div className="flex items-start gap-2">
                <span className={`${colorScheme.primary} mt-1`}>{'>'}</span>
                <textarea
                  ref={inputRef}
                  value={productGoal}
                  onChange={(e) => setProductGoal(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={3}
                  className={`flex-1 bg-transparent outline-none resize-none ${colorScheme.secondary} font-mono text-sm placeholder:${colorScheme.primary} placeholder:opacity-30`}
                  placeholder="Enter your product goal..."
                  disabled={isGenerating}
                />
              </div>
            </div>

            <div className={`mt-4 flex items-center justify-between`}>
              <span className={`${colorScheme.primary} opacity-40 text-xs`}>
                ⌘+Enter to generate
              </span>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !productGoal.trim()}
                className={`px-4 py-2 font-mono text-sm border transition-all ${
                  isGenerating 
                    ? 'border-purple-500 text-purple-400 animate-pulse cursor-wait'
                    : `${colorScheme.border} ${colorScheme.primary} hover:${colorScheme.accent} hover:text-black disabled:opacity-30 disabled:cursor-not-allowed`
                }`}
              >
                {isGenerating ? '⏳ Generating...' : '▶ Generate PRD'}
              </button>
            </div>
          </div>
        </ConsolePanel>

        {/* Error */}
        {error && (
          <div className="mb-6 border border-red-500 bg-red-500/5 p-4 rounded">
            <div className="text-red-500 font-mono text-sm">[ERROR] {error}</div>
          </div>
        )}

        {/* Generation Logs */}
        {isGenerating && logs.length > 0 && (
          <ConsolePanel className="mb-8">
            <ConsoleHeading level={2} className="mb-4">[ GENERATION LOG ]</ConsoleHeading>
            <div className={`bg-black/50 border ${colorScheme.border}/30 p-4 font-mono text-sm space-y-1 max-h-48 overflow-auto`}>
              {logs.map((log, idx) => (
                <div key={idx} className={`${colorScheme.primary} opacity-70`}>
                  <span className="text-purple-400">→</span> {log}
                </div>
              ))}
              <div className={`${colorScheme.primary} animate-pulse`}>
                <span className={showCursor ? 'opacity-100' : 'opacity-0'}>█</span>
              </div>
            </div>
          </ConsolePanel>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Pipeline Overview */}
            <ConsolePanel className="mb-8">
              <ConsoleHeading level={2} className="mb-4">[ PIPELINE OVERVIEW ]</ConsoleHeading>
              <div className="flex flex-wrap gap-2">
                {pipelineStages.map((stage, idx) => (
                  <PipelineStage
                    key={stage.title}
                    icon={stage.icon}
                    title={stage.title}
                    count={stage.count}
                    isActive={false}
                    isComplete={stage.count > 0}
                  />
                ))}
              </div>
              
              {/* Quality Warnings */}
              {result.qualityWarnings.length > 0 && (
                <div className="mt-4 space-y-2">
                  {result.qualityWarnings.map((warning, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-amber-400 font-mono text-xs">
                      <span>⚠️</span>
                      <span>{warning.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </ConsolePanel>

            {/* Detailed Results */}
            <ConsolePanel>
              <ConsoleHeading level={2} className="mb-4">[ PRD RESULTS ]</ConsoleHeading>
              
              {/* Goal */}
              <div className={`mb-6 p-4 rounded-lg ${colorScheme.accent}/10 border ${colorScheme.border}/30`}>
                <div className={`font-mono text-xs ${colorScheme.primary} opacity-50 mb-1`}>PRODUCT GOAL</div>
                <div className={`font-mono text-lg ${colorScheme.secondary} font-bold`}>{result.productGoal}</div>
                <div className={`font-mono text-xs ${colorScheme.primary} opacity-40 mt-2`}>
                  Generated: {new Date(result.generatedAt).toLocaleString('ru-RU')}
                </div>
              </div>

              <div className="space-y-4">
                {/* Intent Vectors */}
                <ExpandableSection 
                  title="Intent Vectors" 
                  icon="🎯" 
                  count={result.intentVectors.length}
                  defaultExpanded
                >
                  {result.intentVectors.map(intent => (
                    <IntentVectorCard key={intent.intentId} intent={intent} />
                  ))}
                </ExpandableSection>

                {/* Research Questions */}
                <ExpandableSection 
                  title="Research Questions" 
                  icon="❓" 
                  count={result.researchQuestions.length}
                >
                  {result.researchQuestions.map(rq => (
                    <ResearchQuestionCard key={rq.rqId} rq={rq} />
                  ))}
                </ExpandableSection>

                {/* Findings */}
                <ExpandableSection 
                  title="Findings" 
                  icon="📊" 
                  count={result.findings.length}
                >
                  {result.findings.map(finding => (
                    <FindingCard key={finding.findingId} finding={finding} />
                  ))}
                </ExpandableSection>

                {/* Product Truths */}
                <ExpandableSection 
                  title="Product Truths" 
                  icon="💎" 
                  count={result.productTruths.length}
                >
                  {result.productTruths.map(truth => (
                    <TruthCard key={truth.truthId} truth={truth} />
                  ))}
                </ExpandableSection>

                {/* Design Principles */}
                <ExpandableSection 
                  title="Design Principles" 
                  icon="⚙️" 
                  count={result.designPrinciples.length}
                >
                  {result.designPrinciples.map(principle => (
                    <PrincipleCard key={principle.principleId} principle={principle} />
                  ))}
                </ExpandableSection>

                {/* Product Requirements */}
                <ExpandableSection 
                  title="Product Requirements" 
                  icon="📋" 
                  count={result.productRequirements.length}
                  defaultExpanded
                >
                  {result.productRequirements.map(req => (
                    <RequirementCard key={req.requirementId} req={req} />
                  ))}
                </ExpandableSection>
              </div>
            </ConsolePanel>

            {/* Generate New Button */}
            <div className="mt-8 text-center py-8">
              <button
                onClick={() => {
                  setResult(null);
                  setProductGoal('');
                  setLogs([]);
                  inputRef.current?.focus();
                }}
                className="text-4xl md:text-6xl font-bold tracking-tight cursor-pointer transition-all duration-300 hover:scale-105 group"
              >
                <span className="text-zinc-600 group-hover:text-zinc-500 transition-colors">new </span>
                <span className={`${colorScheme.primary.replace('-500', '-800')} group-hover:${colorScheme.primary.replace('-500', '-600')} transition-colors`}>prd</span>
              </button>
            </div>
          </>
        )}

        {/* Empty State */}
        {!result && !isGenerating && (
          <ConsolePanel>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <div className={`font-mono ${colorScheme.primary} opacity-60 text-sm`}>
                Enter a product goal to generate PRD
              </div>
              <div className={`font-mono ${colorScheme.primary} opacity-40 text-xs mt-2`}>
                Pipeline: Goal → Intents → Questions → Findings → Truths → Principles → Requirements
              </div>
            </div>
          </ConsolePanel>
        )}
      </div>
    </div>
  );
}
