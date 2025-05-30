export type PlanStep = {
  step: string;
  note: string;
};

export function walkPlan(cert: any): { steps: PlanStep[] } {
  const steps = cert?.plan?.steps || [];

  const summary = steps.map((s: any) => {
    return {
      step: s.id,
      note: `use ${s.use} on ${s.input}, output to ${s.output}`,
    };
  });

  return { steps: summary };
}
