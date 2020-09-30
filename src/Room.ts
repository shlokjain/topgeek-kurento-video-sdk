import Model from './Model';
import Participant from './Participant';

export default class Room extends Model {
  //

  name: string;
  participants: Map<string, Participant> = new Map();
  recording: boolean;
  messages: Array<any> = [];
  room: Room;

  constructor(name: string) {
    super();
    this.name = name;
  }
  connectParticipant(participant: Participant) {
    this.participants.set(participant.name, participant);
    this.emit('participantConnected', participant);
  }
  removeParticipant(participant: Participant) {
    participant.dispose();
    this.participants.delete(participant.name);
    this.emit('participantDisconnected', participant);
  }
}
