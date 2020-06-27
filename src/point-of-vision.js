
const mod = 'point-of-vision';
const modKey = 'pov';
export class PointOfVision {

    static init() {
        Token.prototype.getSightOrigin = function(selectedIndex=false) {
            

            if ( (typeof this.getFlag(mod,modKey)) === 'undefined') {
               this.setFlag(mod,modKey, 0);
            }

            let m = this._movement;
            let p = this.center;

            let lightPositions = [
                this.center,
                {x:this.center.x-this.w, y:this.center.y-this.h}, // top left
                {x:this.center.x+this.w, y:this.center.y-this.h}, // top right
                {x:this.center.x+this.w, y:this.center.y+this.h}, // bottom right
                {x:this.center.x-this.w, y:this.center.y-this.h}, // bottom left
                {x:this.center.x, y:this.center.y-this.h}, // top mid
                {x:this.center.x, y:this.center.y+this.h}, // bottom mid
                {x:this.center.x-this.w, y:this.center.y}, // left mid
                {x:this.center.x+this.w, y:this.center.y}  // right mid
            ]

            console.log(mod,"count:",selectedIndex);
            if (selectedIndex) {
                p = lightPositions[selectedIndex];
            } else {
                let sel = (this.getFlag(mod,modKey)%5 === 0) ? 0 : this.getFlag(mod,modKey);
                p = lightPositions[sel];
            }
            

            if (m) {
                // p = canvas.grid.getSnappedPosition(m.B.x, m.B.y);
                // p = {x:this.center.x-this.w,y:this.center.y-this.w};
            }
            return {
            x: p.x - this._velocity.sx,
            y: p.y - this._velocity.sy
            };
        } // end monkeypatch getSightOrigin


        /**
         * Update lighting data for a single Token source, storing it as a source in the Sight Layer
         * @param {Token} token             The Token object being rendered
         * @param {boolean} defer           Defer rendering the update until later? Default is false
         * @param {boolean} deleted         An optional flag which denotes that the Token object has been deleted
         * @param {Array} walls             Optionally pass an array of Walls which block vision for efficient computation
         * @param {boolean} forceUpdateFog  Forcibly update the Fog exploration progress for the current location
         */
       Token.prototype.updateToken = function(token, {defer=false, deleted=false, walls=null, forceUpdateFog=false}={}) {
            let sourceId = `Token.${token.id}`;
            this.sources.vision.delete(sourceId);
            this.sources.lights.delete(sourceId);
            if ( deleted ) return defer ? null : this.update();
            if ( token.data.hidden && !game.user.isGM ) return;

            // Vision is displayed if the token is controlled, or if it is observed by a player with no tokens controlled
            let displayVision = token._controlled;
            if ( !displayVision && !game.user.isGM && !canvas.tokens.controlled.length ) {
            displayVision = token.actor && token.actor.hasPerm(game.user, "OBSERVER");
            }

            // Take no action for Tokens which are invisible or Tokens that have no sight or light
            const globalLight = canvas.scene.data.globalLight;
            let isVisionSource = this.tokenVision && token.hasSight && displayVision;
            let isLightSource = token.emitsLight;

            // If the Token is no longer a source, we don't need further work
            if ( !isVisionSource && !isLightSource ) return;

            // Prepare some common data
            var center = token.getSightOrigin();
            const maxR = globalLight ? Math.max(canvas.dimensions.width, canvas.dimensions.height) : null;
            let [cullMult, cullMin, cullMax] = this._cull;
            if ( globalLight ) cullMin = maxR;

            // Prepare vision sources

            
            let drawVision = function() {
                // Compute vision polygons
                let dim = globalLight ? 0 : token.getLightRadius(token.data.dimSight);
                const bright = globalLight ? maxR : token.getLightRadius(token.data.brightSight);
                if ((dim === 0) && (bright === 0)) dim = canvas.dimensions.size * 0.6;
                const radius = Math.max(Math.abs(dim), Math.abs(bright));
                const {los, fov} = this.constructor.computeSight(center, radius, {
                    angle: token.data.sightAngle,
                    cullMult: cullMult,
                    cullMin: cullMin,
                    cullMax: cullMax,
                    density: 6,
                    rotation: token.data.rotation,
                    walls: walls
                });

                // Add a vision source
                const source = new SightLayerSource({
                    x: center.x,
                    y: center.y,
                    los: los,
                    fov: fov,
                    dim: dim,
                    bright: bright
                });
                this.sources.vision.set(sourceId, source);

                // Update fog exploration for the token position
                this.updateFog(center.x, center.y, Math.max(dim, bright), token.data.sightAngle !== 360, forceUpdateFog);
            }

            if (isVisionSource) {

                
            try {
                let sel = this.getFlag(mod,modKey);
                if (sel == 5 || sel == 10) {
                    for (let c = sel-4; c <=sel; c++) {
                        center = token.getSightOrigin(c);
                        drawVision();
                    }
                } else {
                    drawVision();
                }
            } catch (error) {}
                drawVision();
            }

            // Prepare light sources
            if ( isLightSource ) {

            // Compute light emission polygons
            const dim = token.getLightRadius(token.data.dimLight);
            const bright = token.getLightRadius(token.data.brightLight);
            const radius = Math.max(Math.abs(dim), Math.abs(bright));
            const {fov} = this.constructor.computeSight(center, radius, {
                angle: token.data.lightAngle,
                cullMult: cullMult,
                cullMin: cullMin,
                cullMax: cullMax,
                density: 6,
                rotation: token.data.rotation,
                walls: walls
            });

            // Add a light source
            const source = new SightLayerSource({
                x: center.x,
                y: center.y,
                los: null,
                fov: fov,
                dim: dim,
                bright: bright,
                color: token.data.lightColor,
                alpha: token.data.lightAlpha
            });
            this.sources.lights.set(sourceId, source);
            }

            // Maybe update
            if ( CONFIG.debug.sight ) console.debug(`Updated SightLayer source for ${sourceId}`);
            if ( !defer ) this.update();
        }










    } // end init

    static renderTokenConfig(tokenconfig) {
        let tab = $("div[data-tab='vision']");
        let newFormEntry = "<div class=\"form-group\">";
        newFormEntry += "<label>Point of Vision</label>";
        newFormEntry += "<select id=\"pov\" name=\"pov\" data-dtype=\"Number\">";
        newFormEntry += "   <optgroup label=\"Default, Center\">";
        newFormEntry += "       <option value=\"0\">Center</option>";
        newFormEntry += "   </optgroup>";
        newFormEntry += "   <optgroup label=\"Corners\">";
        newFormEntry += "       <option value=\"1\">TopLeft</option>";
        newFormEntry += "       <option value=\"2\">TopRight</option>";
        newFormEntry += "       <option value=\"3\">BottomLeft</option>";
        newFormEntry += "       <option value=\"4\">BottomRight</option>";
        newFormEntry += "       <option value=\"5\">All Corners</option>";
        newFormEntry += "   </optgroup>";
        newFormEntry += "   <optgroup label=\"Midpoints\">";
        newFormEntry += "       <option value=\"6\">Top</option>";
        newFormEntry += "       <option value=\"7\">Bottom</option>";
        newFormEntry += "       <option value=\"8\">Left</option>";
        newFormEntry += "       <option value=\"9\">Right</option>";
        newFormEntry += "       <option value=\"10\">All Midpoints</option>";
        newFormEntry += "   </optgroup>";
        newFormEntry += "</select>";
        newFormEntry += "</div>";

        tab.find('div.form-group:nth-of-type(4)').before(newFormEntry);

        $('#pov').val(tokenconfig.object.getFlag(mod,modKey));
    }
    
    static async preUpdateToken(scene,token,change, diff) {
        token = await getTokenByTokenID(token._id);
        console.log(mod,token);
        if (change.hasOwnProperty('pov')) {
            token.setFlag(mod,modKey,change.pov);
        }
    }
}



Hooks.on("init",PointOfVision.init);
Hooks.on("renderTokenConfig",PointOfVision.renderTokenConfig);
Hooks.on("preUpdateToken",PointOfVision.preUpdateToken);

export async function getTokenByTokenID(id) {
    return canvas.tokens.placeables.find( x => {return x.id === id});
}