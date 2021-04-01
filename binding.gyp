{
  "targets": [
    {
      "target_name": "asteroids",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "sources": [
        "cpp/src/AsteroidGenerator.cpp"
      ],
      "include_dirs": [
        '<!@(node -p "require(\'node-addon-api\').include")',
        "cpp/include"
      ],
      "defines": [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ]
    }
  ]
}