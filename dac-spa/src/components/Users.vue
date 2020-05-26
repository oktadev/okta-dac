<template>
    <v-card class="mx-auto my-2" max-width="850">
        <v-card-title>
            Users
            <v-btn color="primary" class="mx-2" small fab @click="addNew">
                <v-icon>mdi-plus</v-icon>
            </v-btn>
            <v-spacer></v-spacer>
            <v-text-field
                v-model="search"
                append-icon="mdi-magnify"
                label="Search"
                single-line
                hide-details
                v-on:keyup="searchUsers"
            ></v-text-field>
        </v-card-title>
        <v-data-table
            :headers="headers"
            :options.sync="options"
            :items="users"
            :server-items-length="totalUsers"
            class="elevation-1"
            :loading="progressBarLoading"
            loading-text="Loading... Please wait"
            no-data-text="No Users in this tenant as yet"
            :hide-default-footer="hideFooter"
        >
            <template v-slot:item.status="{ item }">
                <v-tooltip bottom>
                    <template v-slot:activator="{ on }">
                        <v-chip 
                            :color="getColor(item.status)" 
                            x-small
                            outlined
                            v-on="on"
                            @click="editItem(item)"
                        >{{item.status}}</v-chip>
                    </template>
                    <v-card flat color="transparent" class="mx-auto">
                        <div class="white--text caption">
                            <v-icon size="12" color="grey lighten-2" class="mr-1">mdi-cog</v-icon>
                            Manage
                        </div>
                    </v-card>
                </v-tooltip>
            </template>
            <template v-slot:item.lastLogin="{ item }">{{$utils.offsetDate(item.lastLogin)}}</template>
            <template v-slot:item.action="{ item }">
                <v-tooltip bottom>
                    <template v-slot:activator="{ on }">
                        <div v-on="on">
                            <UserActions 
                                icon='mdi-cog'
                                :user="item"
                                v-on:saving="progressBarLoading=true"
                                v-on:interrupt="progressBarLoading=false"
                                v-on:save="progressBarLoading=false"
                            ></UserActions>
                        </div>
                    </template>
                    <v-card flat color="transparent" class="mx-auto">
                        <div class="white--text caption">Click to list actions</div>
                    </v-card>
                </v-tooltip>
            </template>
            <template v-slot:no-data>
                <v-btn color="primary" @click="initialize">Reset</v-btn>
            </template>
        </v-data-table>
        <v-dialog v-model="dialog" max-width="700px">
            <okta-user
                :user="editedItem"
                :isnew="editedIndex == -1"
                @close="cancel"
                @save="persist"
                @saveClose="saved"
            ></okta-user>
        </v-dialog>
    </v-card>
</template>

<script>
import axios from "axios";
import User from "@/components/User.vue";
import UserActions from "@/components/UserActions.vue";

export default {
    name: "users",
    data: () => ({
        dialog: false,
        statusFilterString: "status+eq+%22ACTIVE%22+or+status+eq+%22STAGED%22+or+status+eq+%22RECOVERY%22+or+status+eq+%22DEPROVISIONED%22+or+status+eq+%22SUSPENDED%22+or+status+eq+%22PROVISIONED%22+or+status+eq+%22LOCKED_OUT%22+or+status+eq+%22PASSWORD_EXPIRED%22",
        headers: [
            { text: "First Name", value: "firstName", sortable: true, align: "start" },
            { text: "Last Name", value: "lastName", sortable: true },
            { text: "E-mail", value: "email", sortable: true },
            { text: "Status", value: "status", sortable: true },
            { text: "Last Login", value: "lastLogin", sortable: false },
            { text: "Actions", value: "action", sortable: false }
        ],
        profileFields: ['firstName', 'lastName', 'email'],
        options: {
            sortBy: ["firstName"],
            sortDesc: [false],
            multiSort: false
        },
        search: null,
        hideFooter: false,
        typingDelayTimer: null,
        users: [],
        next: undefined,
        curr: undefined,
        prev: undefined,
        pages: {
            1: null
        },
        lastSort: null,
        lastSortOrder: null,
        groupId: undefined,
        totalUsers: 0,
        progressBarLoading: false,
        editedIndex: -1,
        editedItem: {
            firstName: "",
            lastName: "",
            email: "",
            status: "",
            lastLogin: "",
            adminFlag: false
        },
        defaultItem: {
            firstName: "",
            lastName: "",
            email: "",
            status: "",
            lastLogin: "",
            adminFlag: false
        }
    }),
    components: {
        oktaUser: User, 
        UserActions
    },
    computed: {
        o4oToken() {
            console.log('fetching o4o token...');
            return this.$store.getters.o4oToken;
        }
    },
    watch: {
        dialog(val) {
            val || this.cancel();
        },
        options: {
            async handler() {
                this.progressBarLoading = true;
                // Dispatch query
                console.log("Dispatching query...");
                await this.loadUsers();
            },
            deep: true
        }
    },
    async created() {
        this.initialize();
        await this.getGroupStats();
    },
    methods: {
        initialize() {
            this.users = [];
        },
        async getGroupStats() {
            if (!this.groupId) {
                const claims = await this.$auth.getUser();
                this.groupId = claims.tenants[0].split(":")[2];
                this.editedItem.groupId = this.groupId;
            }
            const groupInfo = await axios.get(
                this.$config.api + "/api/v1/groups/" + this.groupId + "?expand=stats",
                { headers: { Authorization: "Bearer " + this.o4oToken } }
            );
            if (
                Object.prototype.hasOwnProperty.call(
                    groupInfo.data,
                    "_embedded"
                )
            ) {
                this.totalUsers = groupInfo.data._embedded.stats.usersCount;
            } else {
                console.log("Wasnt able to get User count");
            }
        },
        getColor(status) {
            var color;
            switch (status) {
                case "ACTIVE":
                    color = "black";
                    break;
                case "DEPROVISIONED":
                    color = "grey";
                    break;
                case "DEACTIVATED":
                    color = "grey";
                    break;
                case "SUSPENDED":
                    color = "orange";
                    break;
                case "LOCKED_OUT":
                    color = "orange";
                    break;
                default:
                    color = "blue";
            }
            return color;
        },
        async loadUsers() {
            this.progressBarLoading = true;
            // console.log("options", JSON.stringify(this.options));
            // const { itemsPerPage } = this.options;
            const { page, sortBy, sortDesc, itemsPerPage } = this.options;
            if (sortBy.length <= 0) {
                sortBy.push(this.lastSort);
                sortDesc.push(!this.lastSortOrder);
            } else {
                this.lastSort = sortBy[0];
                this.lastSortOrder = sortDesc[0];
            }

            let params = '?';
            const after = this.pages[page];
            if (after) params += `after=${after}&`;
            params += `limit=${itemsPerPage}`;
            params += `&sortBy=${this.profileFields.includes(sortBy[0]) ? 'profile.' + sortBy[0] : sortBy[0]}`;
            params += `&sortOrder=${sortDesc[0] ? "desc" : "asc"}`;

            if (this.search && this.search.length>0) {
                this.hideFooter = true;
                params += `&search=profile.firstName+sw+%22${this.search}%22+or+profile.lastName+sw+%22${this.search}%22+or+profile.login+sw+%22${this.search}%22`;
            } else {
                this.hideFooter = false;
                params += `&search=${this.statusFilterString}`
            }

            const res = await axios.get(this.$config.api + '/api/v1/users' + params, {
                headers: { Authorization: "Bearer " + this.o4oToken }
            });
            if (res.data) {
                this.users = res.data.map(user => {
                    return {
                        id: user.id,
                        firstName: user.profile.firstName,
                        lastName: user.profile.lastName,
                        email: user.profile.email,
                        status: user.status,
                        lastLogin: user.lastLogin
                    };
                });
                const links = res.headers.link.split(',');
                links.forEach(link=>{
                    const parts = link.trim().split(';');
                    const linkParams = this.$utils.urlParams(parts[0].split('?')[1]);
                    if (parts[1].trim() == 'rel="next"') {
                        this.next = linkParams.after;
                        this.pages[page+1] = this.next;
                    }
                    if (parts[1].trim() == 'rel="self"') {
                        this.curr = linkParams.after;
                        this.pages[page] = this.curr;
                    }
                });
            }
            this.progressBarLoading = false;
        },
        async searchUsers() {
            this.progressBarLoading = true;
            if (this.typingDelayTimer) {
                clearTimeout(this.typingDelayTimer);
            }
            const self = this;            
            this.typingDelayTimer = setTimeout(async function() {
                self.next = null;
                await self.loadUsers();
            }, 300);
        },
        async editItem(item) {
            item.groupId = this.groupId;

            this.editedIndex = this.users.indexOf(item);
            this.editedItem = Object.assign({adminFlag: false}, item);
            this.dialog = true;
        },
        cancel() {
            this.dialog = false;
            setTimeout(() => {
                this.editedItem = Object.assign({}, this.defaultItem);
                this.editedIndex = -1;
            }, 300);
        },
        addNew() {
            this.editedItem.groupId = this.groupId;
            this.dialog = true;
        },
        saved() {
            this.persist();
            this.dialog = false;
        },
        persist(user) {
            if (this.editedIndex > -1) {
                Object.assign(this.users[this.editedIndex], this.editedItem);
            } else {
                this.users.push(this.editedItem);
                this.editedIndex = this.users.indexOf(this.editedItem);
                this.getGroupStats();
            }
        }
    }
};
</script>
