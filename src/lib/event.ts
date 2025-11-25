export type MyEvent<E extends Event, T extends HTMLElement> = E & {
	currentTarget: EventTarget & T;
};
