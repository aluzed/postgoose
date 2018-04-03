

## Postgoose

```

 ()\    .-~~-.-~-.___
  \ \  /    /    Y   ~~-.          ___          _                              __  __    
   | \| o        !       \        / _ \___  ___| |_ __ _  ___   ___  ___  ___  \ \/ _\   
    \ \j         |        k      / /_)/ _ \/ __| __/ _` |/ _ \ / _ \/ __|/ _ \  \ \ \ 
     \__.   |   /         j\    / ___/ (_) \__ \ || (_| | (_) | (_) \__ \  __/\_/ /\ \   
         ~~\\__/   :    _ !     \/    \___/|___/\__\__, |\___/ \___/|___/\___\___/\__/       
        /".   Y__Y   ."\                           |___/      
      /  /\  |  (  /\  \
     [n ] [n ]  [n ] [n ]                           
```


Mongoose-like postgresql library. Minimalistic database feature for the moment :
* CRUD
* some hooks

### Install

```
npm i postgoose
```

**Connect to the database**

```javascript
const conf = {
  "host"     : "localhost",
  "port"     : 5432,
  "database" : "testdb",
  "user"     : "root",
  "password" : "root"
}

postgoose.connect(conf, () => {
  console.log('connected !');
})
```

### Documentation

Please find the documentation [here]()

### Copyright

LICENCE MIT 

Copyright(c) 2018 Alexandre PENOMBRE
<aluzed_AT_gmail.com>



