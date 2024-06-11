import { Field, SmartContract, state, State, method, MerkleWitness, PublicKey, PrivateKey, Signature } from 'o1js';
import { doc } from 'prettier';

export class MerkleWitness4 extends MerkleWitness(4){

}

export class Add extends SmartContract {
  
  @state(Field) nextIndex = State<Field>();
  @state(PublicKey) cpsoPublicKey = State<PublicKey>();
  @state(Field) root = State<Field>();

  init() {
    super.init();
  }

  @method async initState(cpsoPublicKey: PublicKey, initRoot: Field){
    this.cpsoPublicKey.set(cpsoPublicKey);
    this.root.set(initRoot);
    this.nextIndex.set(Field(0));
  }

  @method async addDoctor(cpsoPrivateKey: PrivateKey, doctor: PublicKey, leafWitness: MerkleWitness4){
    const comiitedPublicKey = this.cpsoPublicKey.get();
    if (cpsoPrivateKey.toPublicKey()   !== comiitedPublicKey) {
      throw new Error('Public keys do not match');
    }

    const initialRoot = this.root.get();
    if (this.root.get() !== initialRoot) {
      throw new Error('Roots do not match');
    }

    const newRoot = leafWitness.calculateRoot(doctor.x);
    this.root.set(newRoot);

    const currentIndex = this.nextIndex.get();
    if(this.nextIndex.get() !== currentIndex){
      throw new Error('Indices do not match');
    }

    this.nextIndex.set(currentIndex.add(Field(1)));
  }

  @method async verifySickNote(doctorWitness: MerkleWitness4, doctorPublicKey: PublicKey, signature: Signature, patientPublicKey: PublicKey){
    if (this.root.get() !== doctorWitness.calculateRoot(doctorPublicKey.x)) {
      throw new Error('Roots do not match');
    }

    const verified = signature.verify(doctorPublicKey, patientPublicKey.toFields());
    verified.assertTrue();
  }
}