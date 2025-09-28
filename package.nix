{ pkgs, ... }:
pkgs.stdenv.mkDerivation {
  pname = "panel-pill";
  version = "0";

  src = "${./.}";
  phases = [ "installPhase" ]; # Removes all phases except installPhase

  installPhase = ''
    TODIR=$out/share/gnome-shell/extensions/panelpill@tromshusky
    mkdir -p $TODIR
    cp $src/extension.js $TODIR/
    cp $src/metadata.json $TODIR/
  '';
}
