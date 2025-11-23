import { createContext } from 'svelte';

export const [getEditContext, setEditContext] = createContext<{ checked: boolean }>();
