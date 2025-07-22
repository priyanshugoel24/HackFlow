export interface FormSubmissionEvent {
  preventDefault: () => void;
  target: EventTarget | null;
}
