import type { Writable } from 'svelte/store';

export type ButtonGroupContext = {
  members: Writable<symbol[]>;
  register: () => symbol;
  unregister: (memberId: symbol) => void;
};

export const BUTTON_GROUP_CONTEXT = Symbol('button-group');

