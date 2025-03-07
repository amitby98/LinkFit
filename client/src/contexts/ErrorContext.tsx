import { createContext } from "react";

export const SetErrorContext = createContext<(error: string | undefined) => void>(() => {});
