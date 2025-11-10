{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "unstable";

  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs
    pkgs.postgresql_16
    pkgs.redis # Keep redis-cli for debugging
  ];

  # Sets environment variables in the workspace
  env = {};
}
