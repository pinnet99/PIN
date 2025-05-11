# Device Location Tracker on Solana

A decentralized device location tracking system built on Solana blockchain. This system allows users to scan nearby devices using Bluetooth beacons and record their locations on the blockchain.

## Features

- 📱 Scan and record device locations using Bluetooth beacons
- 🔍 Query device locations by beacon ID
- 📊 View location history with time range filtering
- 🔒 Secure and decentralized storage on Solana blockchain
- ⚡ Fast and efficient location updates

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (latest stable version)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) (latest stable version)
- [Anchor Framework](https://www.anchor-lang.com/docs/installation)
- [Node.js](https://nodejs.org/) (v14 or later)
- [Yarn](https://yarnpkg.com/) (latest version)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/device-tracker.git
cd device-tracker
```

2. Install dependencies:
```bash
yarn install
```

3. Build the program:
```bash
anchor build
```

## Usage

### Local Development

1. Start a local Solana validator:
```bash
solana-test-validator
```

2. Deploy the program:
```bash
anchor deploy
```

3. Run tests:
```bash
anchor test
```

### Program Functions

1. Record Device Location
```typescript
await program.methods
  .recordLocation(
    beaconId,    // String: Device's beacon ID
    latitude,    // Number: Device's latitude
    longitude    // Number: Device's longitude
  )
  .accounts({
    device: devicePda,
    location: locationPda,
    scanner: scanner.publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([scanner])
  .rpc();
```

2. Get Latest Location
```typescript
await program.methods
  .getLatestLocation(beaconId)
  .accounts({
    device: devicePda,
    location: locationPda,
  })
  .rpc();
```

3. Get Location History
```typescript
await program.methods
  .getLocationHistory(
    beaconId,    // String: Device's beacon ID
    startTime,   // Number: Start timestamp
    endTime      // Number: End timestamp
  )
  .accounts({
    device: devicePda,
    location: locationPda,
  })
  .rpc();
```

## Project Structure

```
device-tracker/
├── programs/
│   └── device-tracker/
│       └── src/
│           └── lib.rs         # Main program code
├── tests/
│   └── device-tracker.ts      # Test suite
├── Anchor.toml                # Anchor configuration
├── package.json              # Node.js dependencies
└── README.md                 # This file
```

## Testing

The project includes comprehensive test coverage:

- Basic functionality tests
- Error handling tests
- Location update tests
- Multiple device handling tests
- Time range validation tests

Run the test suite:
```bash
anchor test
```

## Security

- All location data is stored on-chain
- Data validation for coordinates
- Time range validation
- PDA (Program Derived Address) for secure account management

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Solana](https://solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Project Serum](https://project-serum.github.io/)

## Contact

Your Name - [@yourtwitter](https://twitter.com/yourtwitter)

Project Link: [https://github.com/yourusername/device-tracker](https://github.com/yourusername/device-tracker) 