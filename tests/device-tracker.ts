import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { DeviceTracker } from "../target/types/device_tracker";
import { expect } from "chai";
import { assert } from "chai";

describe("device-tracker", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DeviceTracker as Program<DeviceTracker>;
  const scanner = anchor.web3.Keypair.generate();
  const beaconId = "test-beacon-123";

  // Helper function to create PDA accounts
  const createPdaAccounts = async (beaconId: string) => {
    const [devicePda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("device"), Buffer.from(beaconId)],
      program.programId
    );

    const [locationPda] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("location"),
        devicePda.toBuffer(),
        scanner.publicKey.toBuffer(),
      ],
      program.programId
    );

    return { devicePda, locationPda };
  };

  // Test successful location recording
  it("Records device location successfully", async () => {
    const { devicePda, locationPda } = await createPdaAccounts(beaconId);

    await program.methods
      .recordLocation(
        beaconId,
        new anchor.BN(35.6895), // latitude
        new anchor.BN(139.6917) // longitude
      )
      .accounts({
        device: devicePda,
        location: locationPda,
        scanner: scanner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([scanner])
      .rpc();

    const location = await program.account.location.fetch(locationPda);
    expect(location.beaconId).to.equal(beaconId);
    expect(location.latitude.toString()).to.equal("35.6895");
    expect(location.longitude.toString()).to.equal("139.6917");
    expect(location.scanner.toString()).to.equal(scanner.publicKey.toString());
  });

  // Test invalid latitude
  it("Fails when latitude is invalid", async () => {
    const { devicePda, locationPda } = await createPdaAccounts(beaconId);

    try {
      await program.methods
        .recordLocation(
          beaconId,
          new anchor.BN(200.0), // Invalid latitude
          new anchor.BN(139.6917)
        )
        .accounts({
          device: devicePda,
          location: locationPda,
          scanner: scanner.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([scanner])
        .rpc();
      assert.fail("Expected an error but got success");
    } catch (error) {
      expect(error.toString()).to.include("Invalid latitude value");
    }
  });

  // Test invalid longitude
  it("Fails when longitude is invalid", async () => {
    const { devicePda, locationPda } = await createPdaAccounts(beaconId);

    try {
      await program.methods
        .recordLocation(
          beaconId,
          new anchor.BN(35.6895),
          new anchor.BN(200.0) // Invalid longitude
        )
        .accounts({
          device: devicePda,
          location: locationPda,
          scanner: scanner.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([scanner])
        .rpc();
      assert.fail("Expected an error but got success");
    } catch (error) {
      expect(error.toString()).to.include("Invalid longitude value");
    }
  });

  // Test location update
  it("Updates location successfully", async () => {
    const { devicePda, locationPda } = await createPdaAccounts(beaconId);

    // First location
    await program.methods
      .recordLocation(
        beaconId,
        new anchor.BN(35.6895),
        new anchor.BN(139.6917)
      )
      .accounts({
        device: devicePda,
        location: locationPda,
        scanner: scanner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([scanner])
      .rpc();

    // Update location
    await program.methods
      .recordLocation(
        beaconId,
        new anchor.BN(35.6896),
        new anchor.BN(139.6918)
      )
      .accounts({
        device: devicePda,
        location: locationPda,
        scanner: scanner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([scanner])
      .rpc();

    const location = await program.account.location.fetch(locationPda);
    expect(location.latitude.toString()).to.equal("35.6896");
    expect(location.longitude.toString()).to.equal("139.6918");
  });

  // Test getting latest location
  it("Gets latest location successfully", async () => {
    const { devicePda, locationPda } = await createPdaAccounts(beaconId);

    // Record location first
    await program.methods
      .recordLocation(
        beaconId,
        new anchor.BN(35.6895),
        new anchor.BN(139.6917)
      )
      .accounts({
        device: devicePda,
        location: locationPda,
        scanner: scanner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([scanner])
      .rpc();

    // Get latest location
    await program.methods
      .getLatestLocation(beaconId)
      .accounts({
        device: devicePda,
        location: locationPda,
      })
      .rpc();

    const location = await program.account.location.fetch(locationPda);
    expect(location.beaconId).to.equal(beaconId);
  });

  // Test getting location history
  it("Gets location history successfully", async () => {
    const { devicePda, locationPda } = await createPdaAccounts(beaconId);

    const now = Math.floor(Date.now() / 1000);
    const oneHourAgo = now - 3600;

    await program.methods
      .getLocationHistory(beaconId, new anchor.BN(oneHourAgo), new anchor.BN(now))
      .accounts({
        device: devicePda,
        location: locationPda,
      })
      .rpc();
  });

  // Test invalid time range
  it("Fails when time range is invalid", async () => {
    const { devicePda, locationPda } = await createPdaAccounts(beaconId);

    const now = Math.floor(Date.now() / 1000);
    const oneHourAgo = now - 3600;

    try {
      await program.methods
        .getLocationHistory(beaconId, new anchor.BN(now), new anchor.BN(oneHourAgo))
        .accounts({
          device: devicePda,
          location: locationPda,
        })
        .rpc();
      assert.fail("Expected an error but got success");
    } catch (error) {
      expect(error.toString()).to.include("Invalid time range");
    }
  });

  // Test multiple devices
  it("Handles multiple devices correctly", async () => {
    const beaconId2 = "test-beacon-456";
    const { devicePda: devicePda1, locationPda: locationPda1 } = await createPdaAccounts(beaconId);
    const { devicePda: devicePda2, locationPda: locationPda2 } = await createPdaAccounts(beaconId2);

    // Record location for first device
    await program.methods
      .recordLocation(
        beaconId,
        new anchor.BN(35.6895),
        new anchor.BN(139.6917)
      )
      .accounts({
        device: devicePda1,
        location: locationPda1,
        scanner: scanner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([scanner])
      .rpc();

    // Record location for second device
    await program.methods
      .recordLocation(
        beaconId2,
        new anchor.BN(40.7128),
        new anchor.BN(-74.0060)
      )
      .accounts({
        device: devicePda2,
        location: locationPda2,
        scanner: scanner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([scanner])
      .rpc();

    const location1 = await program.account.location.fetch(locationPda1);
    const location2 = await program.account.location.fetch(locationPda2);

    expect(location1.beaconId).to.equal(beaconId);
    expect(location2.beaconId).to.equal(beaconId2);
    expect(location1.latitude.toString()).to.equal("35.6895");
    expect(location2.latitude.toString()).to.equal("40.7128");
  });
}); 