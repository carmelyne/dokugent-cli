/**
 * Returns scaffold-ready default values for DokuVolt certificate sections,
 * aligned with doku-cert-schema.md.
 */
export function getDefaultAnswers(command: CommandType) {
  switch (command) {
    case 'agent':
      return {
        agent: "summarybot",
        description: "Assists with summarizing input text",
        roles: ["summarizer", "formatter"],
        owner: "kinderbytes",
        ownerId: "kinderbytes.org",
        mainTask: "Summarize input as 3 bullet points",
        understands: ["english", "markdown structure"]
      };
    case 'tool-list':
      return {
        tools: ["openai-chat", "markdown-cleaner"]
      };
    case 'plan':
      return {
        planSteps: [
          "summarize_input",
          "reformat_output",
          "check_bullets"
        ]
      };
    case 'criteria':
      return {
        criteria: [
          "must have 3 bullets",
          "max 200 words"
        ]
      };
    case 'conventions':
      return {
        conventions: [
          "formal tone",
          "English only"
        ]
      };
    case 'compliance':
      return {
        contact: {
          name: "Carmelyne Thompson",
          email: "owner@kinderbytes.org"
        },
        dataRetention: "7 days",
        dataSensitivity: [
          "location",
          "personal identifiers"
        ],
        legalBasis: "consent",
        authorizedUsers: [
          "station-chief",
          "fire-investigator"
        ]
      };
    case 'io':
      return {
        protocols: ["markdown", "text/plain"],
        outputs: ["summary.md"],
        allowExternalFiles: true,
        requireApproval: false,
        denylist: ["html", "javascript"]
      };
    default:
      throw new Error(`No defaults defined for command: ${command}`);
  }
}
