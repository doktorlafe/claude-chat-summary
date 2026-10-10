# lafe-backup

Malý zálohovací nástroj v Rustu. Vybrané složky a soubory zabalí do jednoho
`.tar.gz` archivu s časovou značkou v cílové složce (typicky na připojeném
síťovém disku) a staré archivy průběžně maže.

- nastavení přes interaktivní rozhraní v terminálu nebo přes příkazy
- archiv zachovává práva, vlastníky i symlinky (symlinky se nenásledují)
- pokud cíl leží na připojeném disku a ten zrovna připojený není, záloha skončí
  chybou a na lokální disk nic nezapíše
- archiv se píše jako `.partial` a přejmenuje se až po úspěšném dokončení

## Instalace

Je potřeba [Rust](https://rustup.rs) a C linker (`gcc`).

```sh
cargo build --release
install -Dm755 target/release/lafe-backup ~/.local/bin/lafe-backup
```

## Použití

Samotné `lafe-backup` otevře interaktivní nastavení:

| Klávesa | Akce |
| --- | --- |
| `↑` `↓` / `j` `k` | pohyb |
| `Enter` | upravit řádek, otevřít prohlížeč složek |
| `mezerník` | v prohlížeči přidat/odebrat zdroj, vybrat cíl |
| `←` `→` | v prohlížeči o úroveň výš / do složky |
| `.` | zobrazit skryté soubory |
| `e` | napsat cestu ručně |
| `d` | odebrat zdroj nebo vynechané jméno |
| `r` | spustit zálohu |
| `q` | konec |

Totéž jde udělat příkazy:

```
lafe-backup add <cesta>...       přidat složky/soubory k zálohování
lafe-backup remove <cesta>...    odebrat je ze zálohování
lafe-backup dest <složka>        nastavit, kam se archivy ukládají
lafe-backup exclude <jméno>...   přeskakovat soubory/složky s tímto jménem
lafe-backup unexclude <jméno>... přestat je přeskakovat
lafe-backup keep <n>             kolik posledních archivů ponechat (0 = nemazat)
lafe-backup name <jméno>         prefix archivu -> <jméno>-RRRRMMDD-HHMMSS.tar.gz
lafe-backup show | list          vypsat aktuální nastavení
lafe-backup run [--dry-run]      provést zálohu (--dry-run jen vypíše, co by se zálohovalo)
```

Nastavení se ukládá do `~/.config/lafe-backup/config` (jinou cestu určí
proměnná `LAFE_BACKUP_CONFIG`).

## Automatické spouštění

Ve složce `systemd/` je služba a timer, který zálohu pouští denně ve 03:00:

```sh
cp systemd/lafe-backup.{service,timer} ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now lafe-backup.timer
sudo loginctl enable-linger "$USER"   # aby timer běžel i bez přihlášení
```

## Obnova

Archiv obsahuje absolutní cesty bez úvodního lomítka, takže se rozbaluje
běžným `tar`:

```sh
tar -xzf lafe-arm-20261010-225854.tar.gz -C /cilova/slozka
```
