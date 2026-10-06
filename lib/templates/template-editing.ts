export const editableTemplateStatuses = ["DRAFT", "REVIEW", "PUBLISHED"] as const;

export function isEditableTemplateStatus(status: string | null | undefined) {
  return editableTemplateStatuses.some((editable) => editable === status);
}
