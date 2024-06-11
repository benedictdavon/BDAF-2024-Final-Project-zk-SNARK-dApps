import { Field, SmartContract, state, State, method, MerkleWitness, PublicKey, PrivateKey, Signature } from 'o1js';
import { doc } from 'prettier';

export class MerkleWitness4 extends MerkleWitness(4){

}

/**
 * Represents the Add smart contract.
 */
export class Add extends SmartContract {
  
  /**
   * Represents the next index state.
   */
  @state(Field) nextIndex = State<Field>();

  /**
   * Represents the cpso public key state.
   */
  @state(PublicKey) cpsoPublicKey = State<PublicKey>();

  /**
   * Represents the root state.
   */
  @state(Field) root = State<Field>();

  /**
   * Initializes the smart contract.
   */
  init() {
    super.init();
  }

  /**
   * Initializes the state of the smart contract.
   * @param cpsoPublicKey - The CPSO public key.
   * @param initRoot - The initial root.
   */
  @method async initState(cpsoPublicKey: PublicKey, initRoot: Field){
    this.cpsoPublicKey.set(cpsoPublicKey);
    this.root.set(initRoot);
    this.nextIndex.set(Field(0));
  }

  /**
   * Adds a doctor to the smart contract.
   * @param cpsoPrivateKey - The CPSO private key.
   * @param doctor - The doctor's public key.
   * @param leafWitness - The Merkle witness for the leaf node.
   */
  @method async addDoctor(cpsoPrivateKey: PrivateKey, doctor: PublicKey, leafWitness: MerkleWitness4){
    const comiitedPublicKey = this.cpsoPublicKey.get();
    if (cpsoPrivateKey.toPublicKey() !== comiitedPublicKey) {
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

  /**
   * Verifies a sick note.
   * @param doctorWitness - The Merkle witness for the doctor's public key.
   * @param doctorPublicKey - The doctor's public key.
   * @param signature - The signature.
   * @param patientPublicKey - The patient's public key.
   */
  @method async verifySickNote(doctorWitness: MerkleWitness4, doctorPublicKey: PublicKey, signature: Signature, patientPublicKey: PublicKey){
    if (this.root.get() !== doctorWitness.calculateRoot(doctorPublicKey.x)) {
      throw new Error('Roots do not match');
    }

    const verified = signature.verify(doctorPublicKey, patientPublicKey.toFields());
    verified.assertTrue();
  }
}
