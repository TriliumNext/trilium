# Configuration (config.ini or environment variables)
Trilium supports configuration via a file named `config.ini` and environment variables. Please review the file named [config-sample.ini](https://github.com/TriliumNext/Notes/blob/develop/apps/server/src/assets/config-sample.ini) in the [Notes](https://github.com/TriliumNext/Notes) repository to see what values are supported.

You can provide the same values via environment variables instead of the `config.ini` file, and these environment variables use the following format:

1.  Environment variables should be prefixed with `TRILIUM_` and use underscores to represent the INI section structure.
2.  The format is: `TRILIUM_<SECTION>_<KEY>=<VALUE>`
3.  The environment variables will override any matching values from config.ini

For example, if you have this in your config.ini:

```
[Network]
host=localhost
port=8080
```

You can override these values using environment variables:

```
TRILIUM_NETWORK_HOST=0.0.0.0
TRILIUM_NETWORK_PORT=9000
```

The code will:

1.  First load the `config.ini` file as before
2.  Then scan all environment variables for ones starting with `TRILIUM_`
3.  Parse these variables into section/key pairs
4.  Merge them with the config from the file, with environment variables taking precedence