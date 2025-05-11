use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey::Pubkey;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod device_tracker {
    use super::*;

    pub fn record_location(
        ctx: Context<RecordLocation>,
        beacon_id: String,
        latitude: f64,
        longitude: f64,
    ) -> Result<()> {
        // Validate location data
        require!(
            latitude >= -90.0 && latitude <= 90.0,
            DeviceTrackerError::InvalidLatitude
        );
        require!(
            longitude >= -180.0 && longitude <= 180.0,
            DeviceTrackerError::InvalidLongitude
        );

        let location = &mut ctx.accounts.location;
        location.beacon_id = beacon_id;
        location.latitude = latitude;
        location.longitude = longitude;
        location.timestamp = Clock::get()?.unix_timestamp;
        location.scanner = ctx.accounts.scanner.key();

        // Update device information
        let device = &mut ctx.accounts.device;
        device.beacon_id = location.beacon_id.clone();
        device.last_update = location.timestamp;
        device.last_scanner = location.scanner;

        Ok(())
    }

    pub fn get_latest_location(
        ctx: Context<GetLocation>,
        beacon_id: String,
    ) -> Result<()> {
        let device = &ctx.accounts.device;
        require!(
            device.beacon_id == beacon_id,
            DeviceTrackerError::DeviceNotFound
        );
        Ok(())
    }

    pub fn get_location_history(
        ctx: Context<GetLocationHistory>,
        beacon_id: String,
        start_time: i64,
        end_time: i64,
    ) -> Result<()> {
        require!(
            start_time <= end_time,
            DeviceTrackerError::InvalidTimeRange
        );
        Ok(())
    }
}

#[derive(Accounts)]
pub struct RecordLocation<'info> {
    #[account(mut)]
    pub device: Account<'info, Device>,
    #[account(
        init_if_needed,
        payer = scanner,
        space = Location::LEN,
        seeds = [
            b"location",
            device.key().as_ref(),
            scanner.key().as_ref(),
        ],
        bump
    )]
    pub location: Account<'info, Location>,
    #[account(mut)]
    pub scanner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetLocation<'info> {
    pub device: Account<'info, Device>,
    pub location: Account<'info, Location>,
}

#[derive(Accounts)]
pub struct GetLocationHistory<'info> {
    pub device: Account<'info, Device>,
    pub location: Account<'info, Location>,
}

#[account]
pub struct Device {
    pub beacon_id: String,
    pub last_update: i64,
    pub last_scanner: Pubkey,
}

#[account]
pub struct Location {
    pub beacon_id: String,
    pub latitude: f64,
    pub longitude: f64,
    pub timestamp: i64,
    pub scanner: Pubkey,
}

impl Location {
    pub const LEN: usize = 8 + // discriminator
        32 + // beacon_id (String)
        8 + // latitude (f64)
        8 + // longitude (f64)
        8 + // timestamp (i64)
        32; // scanner (Pubkey)
}

#[error_code]
pub enum DeviceTrackerError {
    #[msg("Invalid latitude value")]
    InvalidLatitude,
    #[msg("Invalid longitude value")]
    InvalidLongitude,
    #[msg("Device not found")]
    DeviceNotFound,
    #[msg("Invalid time range")]
    InvalidTimeRange,
} 