# Phone Manager Lite 📞 — Provision IP phones without the ceremony

A Next.js web app for managing IP phone configuration files, firmware and redirects. Supports AudioCodes today; Yealink and Poly are planned.

## Quick start

Requires Podman or Docker (examples use Podman).

```bash
git clone https://github.com/shane/phonemanagerlite.git
cd phonemanagerlite

# 1. Download phone firmware into the firmware folder
mkdir -p public/firmwarefiles
cp /path/to/downloaded/firmware/* public/firmwarefiles/

# 2. Create the default configuration files in public/ipp
mkdir -p public/ipp
touch public/ipp/00000000.cfg public/ipp/dhcpoption160.cfg

# 3. Build and run
podman build -t phone-manager-lite .
podman run -d -p 3000:3000 --name phone-manager-lite phone-manager-lite
```

Open http://localhost:3000.

## Advanced usage

### Installation

The app runs in a container (Podman or Docker). Build the image after the firmware and configuration files are in place, because both are served from `public/`.

```bash
podman build -t phone-manager-lite .
podman run -d -p 3000:3000 --name phone-manager-lite phone-manager-lite
```

With Compose (requires a `.env.production` file in the project root):

```bash
podman compose up -d --build
```

For local development:

```bash
npm install
npm run dev
```

### Firmware

Download the firmware files for your phones and place them under `public/firmwarefiles/`. The app reads this folder, including subfolders such as `sip/`, `sipgateway/` and `teams/`, to list firmware and build redirects.

> The folder name in the code is `firmwarefiles`, not `firmware`. Use `public/firmwarefiles/`.

### Default configuration files

Create two default files and place them in `public/ipp/`:

| File | Purpose |
| --- | --- |
| `00000000.cfg` | Default configuration template for phones without a specific config. |
| `dhcpoption160.cfg` | Configuration referenced by DHCP option 160. It is the app's default file and cannot be deleted from the UI. |

Example `dhcpoption160.cfg` (use the same content for `00000000.cfg`). Replace `<server-ip>` with the address phones use to reach this app:

```ini
; provisioning
provisioning/method=DYNAMIC
provisioning/configuration/url=http://<server-ip>:3000/ipp/dhcpoption160.cfg
provisioning/firmware/url=http://<server-ip>:3000/firmwarefiles/
provisioning/period/hourly/interval=1
provisioning/period/type=HOURLY

; regional settings
voip/regional_settings/selected_country=Australia
voip/regional_settings/selected_timezone=Australia/Brisbane

; disable for production: Telnet is insecure
management/telnet/enabled=1
```

Additional `.cfg` files can be created and edited from the Configuration page.

### Reference

- Supported phones: AudioCodes; Yealink (soon); Poly (soon)
- Features: view and manage phone configurations and firmware

## Contributing

Fork the repository and open a pull request.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).

## Contact

Questions or suggestions: open an issue on GitHub.
