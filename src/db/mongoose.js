const mongoose=require('mongoose')

mongoose.connect(process.env.URI,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useUnifiedTopology: true,
    useFindAndModify:false,

})