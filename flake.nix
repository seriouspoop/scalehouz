{
  description = "Scalehouz.com development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };
      in
      {
        devShells.default = pkgs.mkShell {
          name = "scalehouz";

          packages = with pkgs; [
            bun
            nixfmt
            nixd
          ];

          shellHook = ''
            export PROMPT_COMMAND='export PS1="\[\033[0;35m\]scalehouz\[\033[0m\]:\[\033[0;34m\]\w\[\033[0m\]\[\033[38;5;204m\]$(b=$(git branch --show-current 2>/dev/null); [ -n "$b" ] && echo " ($b)")\[\033[0m\] $ "'
          '';
        };
      }
    );
}
