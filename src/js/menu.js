//

const openCloseMenu = () => {
    try{
        const checkbox = document.getElementById("nav");
        checkbox.addEventListener("change", function () {
            if(checkbox.checked === true){
                document.querySelector('.menu').classList.add('vertical');
            } else {
                document.querySelector('.menu').classList.remove('vertical');
            }
        })
    }catch (e) {
        console.log("Error",e);
    }
};
openCloseMenu();
