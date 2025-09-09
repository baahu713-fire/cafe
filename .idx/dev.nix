{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-23.11"; # Or "unstable"
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_20,
    pkgs.python311,
    pkgs.postgresql_16,
    pkgs.python311Packages.fastapi,
    pkgs.python311Packages.uvicorn,
    pkgs.python311Packages.sqlalchemy,
    pkgs.python311Packages.passlib,
    pkgs.python311Packages.bcrypt
  ];
  # Sets environment variables in the workspace
  env = {};
}
