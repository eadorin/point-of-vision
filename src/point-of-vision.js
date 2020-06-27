
const mod = 'point-of-vision';
const modKey = 'pov';
export class PointOfVision {

    static init() {
        Token.prototype.getSightOrigin = function() {

            if ( (typeof this.getFlag(mod,modKey)) === 'undefined') {
               this.setFlag(mod,modKey, 0);
            }

            let m = this._movement;
            let p = this.center;

            switch (this.getFlag(mod,modKey)) {
                case 1:
                    p = {x:this.center.x-this.w,y:this.center.y-this.h};
                    break;
                case 2:
                    p = {x:this.center.x+this.w,y:this.center.y-this.h};
                    break;
                case 3:
                    p = {x:this.center.x+this.w,y:this.center.y+this.h};
                    break;
                case 4:
                    p = {x:this.center.x-this.w,y:this.center.y-this.h};
                    break;
                case 0:
                default:
                    p = this.center;
                    break;
            }
            console.log(mod,this.getFlag(mod,modKey));

            if (m) {
                // p = canvas.grid.getSnappedPosition(m.B.x, m.B.y);
                // p = {x:this.center.x-this.w,y:this.center.y-this.w};
            }
            return {
            x: p.x - this._velocity.sx,
            y: p.y - this._velocity.sy
            };
        } // end monkeypatch
    } // end init

    static renderTokenConfig(tokenconfig) {
        let tab = $("div[data-tab='vision']");
        let newFormEntry = "<div class=\"form-group\">";
        newFormEntry += "<label>Point of Vision</label>";
        newFormEntry += "<select id=\"pov\" name=\"pov\" data-dtype=\"Number\">";
        newFormEntry += "   <option value=\"0\">Center</option>";
        newFormEntry += "   <option value=\"1\">TopLeft</option>";
        newFormEntry += "   <option value=\"2\">TopRight</option>";
        newFormEntry += "   <option value=\"3\">BottomLeft</option>";
        newFormEntry += "   <option value=\"4\">BottomRight</option>";
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