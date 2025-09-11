{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "unstable"; # Or "unstable"
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs
    pkgs.postgresql_16
  ];
  # Sets environment variables in the workspace
  env = {};
}
