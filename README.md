# remote-ssh-kitty package

Fork of [github.com/dsone/remote-ssh](http://github.com/dsone/remote-ssh "dsone/remote-ssh").

It uses Kitty instead of Putty and allows integration with ConEmu64.

If you provide `remote` parameter in `.ftpconfig` Kitty will automatically change directory when connecting.

Setting `integration` parameter to `conemu` will open kitty ssh session in new ConEmu tab.

**Disclaimer**: both `kitty` and `ConEmu64` must be on you system PATH.
