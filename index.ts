import {Dex, ModdedDex, Species} from '@pkmn/dex';
import {Generation, Generations, Specie} from '@pkmn/data';

import ObjectsToCSV from 'objects-to-csv';

async function generateValues(dex: Generation | ModdedDex, species: Specie[] | Species[]) {
  
  const tiers: string[] = [];
  
  const tierMap: { [x: string]: string } = {
    "(PU)": "ZU",
    "PUBL": "NU",
    "NUBL": "RU",
    "RUBL": "UU",
    "UUBL": "OU",
    "AG": "Uber"
  };
  
  const healingMove = ["Recover", "Synthesis", "Wish", "Moonlight", "Soft-Boiled", "Roost", "Slack Off", "Shore Up", "Strength Sap"];

  // HP (numerical) / ATK (numerical) / DEF (numerical) / SPA (numerical) / SPD (numerical) / SPEED (numerical) / ABILITY (categorical) / ABILITY (categorical) / ABILITY (categorical) / TYPE (categorical) / TYPE (categorical) / STRONGEST ATTACK (numerical) / RECOVERY (categorical: true / false) (categorical) / Coverage Attacks (numerical) / PREVO (categorical: true / false)
  
  const values: {
    hp: number,
    atk: number,
    def: number,
    spa: number,
    spd: number,
    speed: number,
    ability1: string,
    ability2?: string,
    ability3?: string,
    type1: string,
    type2?: string,
    bst: number,
    //strongestAttack: number,
    //recovery: number,
    //coverageAttacks: number,
    //prevo: number,
    tier: string,
    name: string,
  }[] = [];
  
  for (const specie of species) {
    if (!(tiers.some((tier) => tier === specie.tier))) {
      tiers.push(specie.tier);
    }
    const learnset = (await dex.learnsets.get(specie.name));
    let highestBPStab = 0;
    let recovery = false;
    let coverageTypes: string[] = [];
    if (learnset && learnset.learnset) {
      const learnsetObj = learnset.learnset;
      for (const move of Object.keys(learnsetObj)) {
        const moveGot = dex.moves.get(move);
        if (moveGot) {
          if (moveGot.type === specie.types[0] || moveGot.type === specie.types[1]) {
            if (moveGot.basePower > highestBPStab) {
              highestBPStab = moveGot.basePower;
            }
            if (moveGot.name === "Fishious Rend" || moveGot.name === "Bolt Beak") {
              highestBPStab = 170;
            }
          }
          if (healingMove.some((hMove) => hMove === moveGot.name)) {
            recovery = true;
          }
          if (moveGot.basePower > 0) {
            if (!coverageTypes.some((coverageType) => coverageType === moveGot.type)) {
              coverageTypes.push(moveGot.type);
            }
          }
        }
      }
    }
    let tier: string = specie.tier;
    if (tierMap[tier]) {
      tier = tierMap[tier];
    }

    if (tier === "NFE") {
      continue;
    }

    values.push({
      hp: specie.baseStats.hp,
      atk: specie.baseStats.atk,
      def: specie.baseStats.def,
      spa: specie.baseStats.spa,
      spd: specie.baseStats.spd,
      speed: specie.baseStats.spe,
      ability1: specie.abilities[0],
      ability2: specie.abilities[1],
      ability3: specie.abilities.H,
      type1: specie.types[0],
      type2: specie.types[1],
      bst: specie.baseStats.hp + specie.baseStats.atk + specie.baseStats.def + specie.baseStats.spa + specie.baseStats.spd + specie.baseStats.spe,
      //strongestAttack: highestBPStab,
      //recovery: recovery ? 1 : 0,
      //coverageAttacks: coverageTypes.length,
      //prevo: specie.nfe ? 1 : 0,
      tier: tier,
      name: specie.name,
    });
  }
  console.log(tiers);

  return values;
  
}

async function calculate () {

  const gens = new Generations(Dex);
  const gen8Dex = gens.get(8);
  
  const values = await generateValues(gen8Dex, Array.from(gen8Dex.species));

  const csv = new ObjectsToCSV(values);

  await csv.toDisk('./test.csv');
  
  const hisuiForms = Dex.species.all().filter((species) => 
    species.forme === 'Hisui'
    ||species.name === 'Wyrdeer'
    ||species.name === 'Kleavor'
    ||species.name === 'Ursaluna'
    ||species.name === 'Basculegion'
    ||species.name === 'Sneasler'
    ||species.name === 'Overqwil'
    ||species.name.includes('Enamorus'));
  const hisuiValues = await generateValues(Dex, hisuiForms);
  const hisuicsv = new ObjectsToCSV(hisuiValues);

  await hisuicsv.toDisk('./hisui.csv');
}

calculate();
