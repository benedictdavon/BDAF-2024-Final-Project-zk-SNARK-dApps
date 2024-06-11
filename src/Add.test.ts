// NOT YET FINISHED!!!! NOT YET FINISHED!!!! NOT YET FINISHED!!!!
// NOT YET FINISHED!!!! NOT YET FINISHED!!!! NOT YET FINISHED!!!! 
// NOT YET FINISHED!!!! NOT YET FINISHED!!!! NOT YET FINISHED!!!! 
// NOT YET FINISHED!!!! NOT YET FINISHED!!!! NOT YET FINISHED!!!!
// NOT YET FINISHED!!!! NOT YET FINISHED!!!! NOT YET FINISHED!!!!
// NOT YET FINISHED!!!! NOT YET FINISHED!!!! NOT YET FINISHED!!!!
// NOT YET FINISHED!!!! NOT YET FINISHED!!!! NOT YET FINISHED!!!!

import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Signature } from 'o1js';
import { Add, MerkleWitness4 } from './Add';

const doSetup = () => {
  // Create test accounts
  const cpsoKeyPair = PrivateKey.random();
  const cpsoPublicKey = cpsoKeyPair.toPublicKey();

  const doctorKeyPair = PrivateKey.random();
  const doctorPublicKey = doctorKeyPair.toPublicKey();

  const patientKeyPair = PrivateKey.random();
  const patientPublicKey = patientKeyPair.toPublicKey();

  const testAccountKeyPair = PrivateKey.random();
  const testAccountPublicKey = testAccountKeyPair.toPublicKey();

  // Create the initial state
  const initialRoot = Field(0);
  const witness = new MerkleWitness4([]);

  return { cpsoKeyPair, cpsoPublicKey, doctorKeyPair, doctorPublicKey, patientKeyPair, patientPublicKey, testAccountKeyPair, testAccountPublicKey, initialRoot, witness };
};

describe('Add Smart Contract', () => {
  let zkApp: Add;
  let deployerAccount: PublicKey;
  let deployerKey: PrivateKey;
  let testSetup: any;

  beforeAll(async () => {
    // Set up local Mina instance and accounts
    const Local = Mina.LocalBlockchain();
    Mina.setActiveInstance(await Local);

    testSetup = doSetup();
    deployerAccount = testSetup.testAccountPublicKey;
    deployerKey = testSetup.testAccountKeyPair;

    // Deploy contract
    zkApp = new Add(deployerAccount);
    const txn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp.deploy({ deployerKey });
    });
    await txn.send();
  });


  it('should initialize state correctly', async () => {
    const txn = await Mina.transaction(deployerAccount, () => {
      zkApp.initState(testSetup.cpsoPublicKey, testSetup.initialRoot);
      zkApp.sign(deployerKey);
    });
    await txn.send();

    const storedCpsoPublicKey = zkApp.cpsoPublicKey.get();
    const storedRoot = zkApp.root.get();
    const storedNextIndex = zkApp.nextIndex.get();

    expect(storedCpsoPublicKey).toEqual(testSetup.cpsoPublicKey);
    expect(storedRoot).toEqual(testSetup.initialRoot);
    expect(storedNextIndex).toEqual(Field(0));
  });

  it('should add a doctor correctly', async () => {
    const txn = await Mina.transaction(deployerAccount, () => {
      zkApp.addDoctor(testSetup.cpsoKeyPair, testSetup.doctorPublicKey, testSetup.witness);
      zkApp.sign(deployerKey);
    });
    
    await txn.send();

    const storedRoot = zkApp.root.get();
    const storedNextIndex = zkApp.nextIndex.get();

    const expectedRoot = testSetup.witness.calculateRoot(testSetup.doctorPublicKey.x);
    expect(storedRoot).toEqual(expectedRoot);
    expect(storedNextIndex).toEqual(Field(1));
  });

  it('should verify a sick note correctly', async () => {
    // Simulate a signature from the doctor
    const message = testSetup.patientPublicKey.toFields();
    const signature = Signature.create(testSetup.doctorKeyPair, message);

    const txn = await Mina.transaction(deployerAccount, () => {
      zkApp.verifySickNote(testSetup.witness, testSetup.doctorPublicKey, signature, testSetup.patientPublicKey);
      zkApp.sign(deployerKey);
    });
    await txn.send();

    // If no errors are thrown, the test passes
  });
});
