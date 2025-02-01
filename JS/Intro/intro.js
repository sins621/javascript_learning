function HouseKeeper(yearsOfExperience, name, cleaningRepertoire) {
  this.yearsOfExperience = yearsOfExperience;
  this.name = name;
  this.cleaningRepertoire = cleaningRepertoire;
  this.clean = function () {
    console.log("I cleaned");
  };
}

let puss = new HouseKeeper(12, "frans", ["celani", "fjsdf", "dfs"]);

puss.clean();
