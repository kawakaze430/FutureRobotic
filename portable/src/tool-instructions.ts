// Static, allowlisted tasks; source, language labels, attachments, and user instructions stay in the data message.
const instructions:Record<string,string>={
 convert:'Translate the supplied source to the requested target language. Preserve observable behavior and call out unavoidable incompatibilities in code comments. Return complete code without Markdown fences. Do not claim semantic equivalence was tested.',
 generate:'Implement the supplied specification in the requested target language. Respect stated dependencies and interfaces, handle described edge cases, and return complete code without Markdown fences. Do not invent successful tests.',
 explain:'Explain purpose, inputs, outputs, control flow, important dependencies, and edge cases. Include a small worked example and time/space complexity when they can be inferred. Label assumptions and uncertainty. Use Markdown.',
 review:'Review correctness, security, and maintainability. For each issue provide severity, affected lines or exact evidence, reasoning, and a concrete suggested correction. Separate observed facts from assumptions. Include a small test or checker snippet when helpful. Use Markdown; never claim checks were executed.',
 fix:'Return the complete corrected source, not a patch or fragments. Preserve unrelated behavior and the requested public interface. Use code comments for assumptions when needed. Return code without Markdown fences. The original source must never be described as already changed.',
 refactor:'Refactor the complete source while preserving the requested interface and observable behavior. Return complete code without Markdown fences. Do not claim execution or equivalence proof.',
 tests:'Propose tests for the supplied source, including ordinary, boundary, and failure cases. Distinguish runnable test code from assumptions about dependencies. Never invent test results.',
 chat:'Answer the follow-up using the current source, current result, and selected file snapshots. Refer to available evidence and disclose omitted context. When proposing a replacement, include a complete fenced code block for user review. Never claim a change was applied, a command ran, or tests passed.',
};
export const toolInstruction=(tool:string)=>instructions[tool]??'Respond to the supplied coding task without executing code or inventing verification.';
