import { UseMutationResult } from "@tanstack/react-query";

type AfterMutationOptions = {
  onSuccessMessage?: string;
  afterSuccess?: () => void;
  onErrorMessage?: string;
  afterError?: (e: Error) => void;
};

type LynxMutationOptions = {
  id: string; // The object ID to be mutated
  updates: { [key: string]: any }; // The fields to be updated
  options?: AfterMutationOptions; // Stuff for after the mutation is submitted
};

// Just a way for us to standarize how we want mutations to be
// structured so we can pass them around somewhat easily.
export type GenericLynxMutator<T> = UseMutationResult<
  T,
  Error,
  LynxMutationOptions
>;

export type GenericLynxCreationMutator<T, F> = UseMutationResult<
  T,
  Error,
  {
    fields: F;
    options?: AfterMutationOptions;
  }
>;
