// Mock implementation
/* eslint-disable no-console */
export const useToast = () => ({
  toast: (props: unknown) => console.log(props),
});
