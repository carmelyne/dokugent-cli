// Reference: baseline structure expected in all default scaffolds
export const expectedInitFiles = [
  'README.md',
  'AGENT_INSTRUCTIONS.md',
  'PROJECTS.md',
  'llm-load.yml'
];

export const docConventions = {
  default: [
    'conventions/changelog/v0.1.md',
    'conventions/db-schema/migrations.md',
    'conventions/db-schema/models.md',
    'conventions/db-schema/relationships.md',
    'conventions/db-schema/seed-data.md',
    'conventions/design-system/components.md',
    'conventions/design-system/tokens.md',
    'conventions/devops/dependency-log.md',
    'conventions/devops/deploy.md',
    'conventions/devops/setup.md',
    'conventions/marketing/launch-checklist.md',
    'conventions/mvc/controllers.md',
    'conventions/mvc/models.md',
    'conventions/mvc/routes.md',
    'conventions/mvc/views.md',
    'conventions/qa/checklist.md',
    'conventions/qa/edge-cases.md',
    'conventions/security/auth.md',
    'conventions/tech-seo/meta.md',
    'conventions/tech-seo/sitemap.md',
    'conventions/testing/manual.md',
    'conventions/testing/unit.md',
    'conventions/ux/flows.md',
    'conventions/ux/personas.md'
  ],

  minimal: [
    'conventions/ux/flows.md',
    'conventions/ux/personas.md',
    'conventions/mvc/controllers.md',
    'conventions/db-schema/models.md'
  ],

  research: [
    'literature/context.md',
    'hypotheses/main.md',
    'experiment/setup.md',
    'results/findings.md',
    'conventions/qa/edge-cases.md'
  ]
};