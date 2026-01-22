import { Injectable, makeEnvironmentProviders } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MessageService } from '../components/3-click-me-message-via-service';

@Injectable({ providedIn: 'root' })
export class MessageServiceFake implements MessageService {
  #message = '';
  getMessage() {
    return this.#message;
  }
  setMessage(message: string) {
    this.#message = message;
  }
}

export const provideMessageServiceFake = () =>
  makeEnvironmentProviders([
    {
      provide: MessageService,
      useExisting: MessageServiceFake,
    },
  ]);

export const injectMessageServiceFake = () => {
  return TestBed.inject(MessageServiceFake);
};
