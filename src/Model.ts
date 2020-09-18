import { remove } from 'lodash';

export type Listener = (...args: Array<any>) => void;

export default class Model {
  eventListenersMap: Map<string, Array<Listener>> = new Map();

  on(message: string, listener: Listener) {
    const existingArrOfListeners = this.eventListenersMap.get(message);

    if (existingArrOfListeners) {
      existingArrOfListeners.push(listener);
      this.eventListenersMap.set(message, existingArrOfListeners);
    } else {
      this.eventListenersMap.set(message, [listener]);
    }
  }

  emit(message: string, event: any) {
    const existingArrOfListeners = this.eventListenersMap.get(message);
    if (existingArrOfListeners) {
      existingArrOfListeners.forEach((listener, index) => {
        listener(event);
      });
    }
  }

  off(key: string, listener: Listener) {
    const existingArrOfListeners = this.eventListenersMap.get(key);
    if (!existingArrOfListeners) {
      return;
    }

    remove(existingArrOfListeners, n => {
      return n === listener;
    });

    if (existingArrOfListeners.length === 0) {
      this.eventListenersMap.delete(key);
    }
  }
}
