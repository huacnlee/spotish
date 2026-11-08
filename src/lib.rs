//! Spotish's Rust crate: the engine that runs and drives Spotify's own web
//! player (`spotify`), exported to the TSX UI as the `Spotify` class
//! (`exports`). The screens are TSX (`App.tsx`); this crate ships in the
//! binary and does the work TSX cannot: processes, sockets and the browser.

pub mod audio;
pub mod exports;
pub mod media;
pub mod spotify;
pub mod theme;
pub mod version;

use nsh_core::prelude::*;

pub use audio::AudioMeter;
pub use exports::Spotify;
pub use media::MediaControls;
pub use theme::SystemTheme;
pub use version::Version;

/// The crate's UI set: what `App.tsx` imports from `spotish/native`.
#[native_module("spotish/native")]
fn native(registry: &mut Registry) {
    registry
        .class::<Spotify>()
        .class::<MediaControls>()
        .class::<SystemTheme>()
        .class::<AudioMeter>()
        .module::<Version>();
}
