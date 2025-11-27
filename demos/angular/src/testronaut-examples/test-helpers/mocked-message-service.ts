import { MessageService } from '../components/3-click-me-message-via-service';

export class MockedMessageService implements MessageService {
  getMessage() {
    return 'Mocked Lift Off!';
  }
}
