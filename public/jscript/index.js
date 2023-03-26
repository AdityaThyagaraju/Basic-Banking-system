$(".dashboard-links").on("click",function(event){
    let curid = $(".dashboard-links-clicked").attr('id');
    let id =event.currentTarget.id;
    $(".dashboard-links-clicked").removeClass("dashboard-links-clicked").addClass("dashboard-links");
    $(event.currentTarget).removeClass("dashboard-links").addClass("dashboard-links-clicked");
    console.log(curid);
    if(curid=="1"){
        $("#home").css("display","none");
    }
    else if(curid=="2"){
        $("#withdraw").css("display","none");
    }
    else if(curid=="3"){
        $("#deposit").css("display","none");
    }
    else{
        $("#transfer").css("display","none");
    }

    if(id=="1"){
        $("#home").css("display","");
    }
    else if(id=="2"){
        $("#withdraw").css("display","");
    }
    else if(id=="3"){
        $("#deposit").css("display","");
    }
    else{
        $("#transfer").css("display","");
    }
});

function withdrawPass(){
    $("#w-amount").css("display","none");
    $('#w-t-pass').css("display","");
}

function depositPass(){
    $("#d-amount").css("display","none");
    $('#d-t-pass').css("display","");
}

function transferPass(){
    $("#t-amount").css("display","none");
    $('#t-t-pass').css("display","");
}